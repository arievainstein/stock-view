from fastapi import APIRouter, HTTPException, Query
import logging
from api.models.stock import Stock, StockChartResponse, ChartDataPoint, StockOverview, PeriodStats
from api.services import alpha_vantage
from api.services.calculations import linear_regression_channel

logger = logging.getLogger(__name__)

# Timeframe → number of bars to keep per interval type (None = keep all).
# Intraday is always compact (~100 bars) so no slicing needed.
_TIMEFRAME_BARS: dict[str, dict[str, int | None]] = {
    "daily":   {"1M": 22,  "3M": 65,  "6M": 130, "1Y": 252,  "5Y": 1260, "ALL": None},
    "weekly":  {"1M": 4,   "3M": 13,  "6M": 26,  "1Y": 52,   "5Y": 260,  "ALL": None},
    "monthly": {"1M": 1,   "3M": 3,   "6M": 6,   "1Y": 12,   "5Y": 60,   "ALL": None},
}

_INTRADAY_INTERVALS = {"5min", "15min", "30min", "60min"}
_TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"]

router = APIRouter(prefix="/stocks", tags=["stocks"])


def _format_volume(vol: int) -> str:
    if vol >= 1_000_000_000:
        return f"{vol / 1_000_000_000:.1f}B"
    if vol >= 1_000_000:
        return f"{vol / 1_000_000:.1f}M"
    if vol >= 1_000:
        return f"{vol / 1_000:.1f}K"
    return str(vol)


def _format_market_cap(cap: float) -> str:
    if cap >= 1_000_000_000_000:
        return f"{cap / 1_000_000_000_000:.2f}T"
    if cap >= 1_000_000_000:
        return f"{cap / 1_000_000_000:.2f}B"
    if cap >= 1_000_000:
        return f"{cap / 1_000_000:.2f}M"
    return str(cap)


@router.get("/quote/{symbol}", response_model=Stock)
async def get_stock_quote(symbol: str):
    """Get real-time quote for a stock symbol."""
    logger.info("Quote request received for symbol=%s", symbol)
    quote = await alpha_vantage.get_quote(symbol.upper())
    if not quote or "05. price" not in quote:
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found")

    price = float(quote.get("05. price", 0))
    prev_close = float(quote.get("08. previous close", 0))
    change = float(quote.get("09. change", 0))
    change_pct = float(quote.get("10. change percent", "0%").replace("%", ""))
    volume = int(quote.get("06. volume", 0))
    high = float(quote.get("03. high", 0))
    low = float(quote.get("04. low", 0))
    open_price = float(quote.get("02. open", 0))

    return Stock(
        symbol=symbol.upper(),
        name=symbol.upper(),
        price=price,
        change=change,
        changePercent=change_pct,
        volume=_format_volume(volume),
        marketCap="N/A",
        high=high,
        low=low,
        open=open_price,
        previousClose=prev_close,
    )


@router.get("/chart/{symbol}", response_model=StockChartResponse)
async def get_stock_chart(
    symbol: str,
    interval: str = Query("daily", enum=["5min", "15min", "30min", "60min", "daily", "weekly", "monthly"]),
    regression: bool = Query(True, description="Include linear regression channel"),
    timeframe: str = Query("3M", enum=_TIMEFRAMES),
):
    """Get OHLCV chart data for a symbol, optionally with regression channel."""
    logger.info(
        "Chart request received for symbol=%s interval=%s timeframe=%s regression=%s",
        symbol,
        interval,
        timeframe,
        regression,
    )
    symbol = symbol.upper()

    if interval == "daily":
        raw = await alpha_vantage.get_daily(symbol, outputsize="full")
        series_key = "Time Series (Daily)"
    elif interval == "weekly":
        raw = await alpha_vantage.get_weekly(symbol)
        series_key = "Weekly Time Series"
    elif interval == "monthly":
        raw = await alpha_vantage.get_monthly(symbol)
        series_key = "Monthly Time Series"
    else:
        raw = await alpha_vantage.get_intraday(symbol, interval)
        series_key = f"Time Series ({interval})"

    series = raw.get(series_key)
    if not series:
        raise HTTPException(status_code=404, detail=f"No chart data for '{symbol}'")

    data = [
        ChartDataPoint(
            time=ts,
            open=float(v["1. open"]),
            high=float(v["2. high"]),
            low=float(v["3. low"]),
            close=float(v["4. close"]),
            volume=int(v["5. volume"]),
        )
        for ts, v in sorted(series.items())
    ]

    # Server-side slicing — skip for intraday (already compact)
    if interval not in _INTRADAY_INTERVALS:
        interval_bars = _TIMEFRAME_BARS.get(interval, {})
        limit = interval_bars.get(timeframe)  # None means keep all
        if limit is not None:
            data = data[-limit:]

    # Compute period statistics over the sliced window
    stats: PeriodStats | None = None
    if len(data) >= 2:
        period_open = data[0].open
        period_close = data[-1].close
        period_high = max(p.high for p in data)
        period_low = min(p.low for p in data)
        period_volume = sum(p.volume for p in data)
        period_change = period_close - period_open
        period_change_pct = (period_change / period_open * 100) if period_open else 0.0
        stats = PeriodStats(
            period_change=round(period_change, 4),
            period_change_pct=round(period_change_pct, 4),
            period_high=period_high,
            period_low=period_low,
            period_volume=period_volume,
            period_open=period_open,
            period_close=period_close,
        )

    reg_channel = linear_regression_channel(data) if regression else None

    return StockChartResponse(symbol=symbol, data=data, regression_channel=reg_channel, period_stats=stats)


@router.get("/overview/{symbol}", response_model=StockOverview)
async def get_stock_overview(symbol: str):
    """Get company fundamentals and overview from Alpha Vantage OVERVIEW."""
    logger.info("Overview request received for symbol=%s", symbol)
    data = await alpha_vantage.get_overview(symbol.upper())
    if not data or "Symbol" not in data:
        raise HTTPException(status_code=404, detail=f"Overview not found for '{symbol}'")
    return StockOverview(
        symbol=data.get("Symbol", symbol.upper()),
        name=data.get("Name", ""),
        description=data.get("Description", ""),
        sector=data.get("Sector", ""),
        industry=data.get("Industry", ""),
        employees=data.get("FullTimeEmployees", "N/A"),
        pe_ratio=data.get("PERatio", "N/A"),
        eps=data.get("EPS", "N/A"),
        dividend_yield=data.get("DividendYield", "N/A"),
        week_52_high=data.get("52WeekHigh", "N/A"),
        week_52_low=data.get("52WeekLow", "N/A"),
        avg_volume=data.get("10DayAverageTradingVolume", "N/A"),
        market_cap=data.get("MarketCapitalization", "N/A"),
    )


@router.get("/search")
async def search_stocks(q: str = Query(..., min_length=1)):
    """Search for stock symbols by keyword."""
    logger.info("Symbol search request received for query=%s", q)
    results = await alpha_vantage.search_symbol(q)
    return [
        {
            "symbol": r.get("1. symbol"),
            "name": r.get("2. name"),
            "type": r.get("3. type"),
            "region": r.get("4. region"),
            "currency": r.get("8. currency"),
        }
        for r in results
    ]
