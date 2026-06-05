from fastapi import APIRouter, HTTPException, Query
from api.models.stock import ChartDataPoint, RegressionChannel
from api.services import alpha_vantage
from api.services.calculations import (
    linear_regression_channel,
    linear_regression_channel_log,
    simple_moving_average,
    exponential_moving_average,
)

router = APIRouter(prefix="/calculations", tags=["calculations"])

# Timeframe → number of daily bars (used by log regression presets)
_TIMEFRAME_BARS: dict[str, int | None] = {
    "1D": 78,
    "1W": 56,
    "1M": 22,
    "3M": 65,
    "6M": 130,
    "1Y": 252,
    "5Y": 1260,
    "ALL": None,
}

_TIMEFRAME_ENUM = list(_TIMEFRAME_BARS.keys())


async def _get_daily_data(symbol: str, outputsize: str = "full") -> list[ChartDataPoint]:
    raw = await alpha_vantage.get_daily(symbol, outputsize=outputsize)
    series = raw.get("Time Series (Daily)")
    if not series:
        raise HTTPException(status_code=404, detail=f"No data for '{symbol}'")
    return [
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


@router.get("/regression/{symbol}", response_model=RegressionChannel)
async def get_regression_channel(
    symbol: str,
    std_multiplier: float = Query(2.0, ge=0.5, le=5.0),
):
    """Calculate and return a linear regression channel for a symbol."""
    data = await _get_daily_data(symbol.upper())
    return linear_regression_channel(data, std_multiplier)


@router.get("/regression-log/{symbol}", response_model=RegressionChannel)
async def get_regression_log_channel(
    symbol: str,
    length: int = Query(800, ge=10, le=5000, description="Number of bars to include in the regression"),
    upper_mult: float = Query(2.0, ge=0.0, le=10.0, description="Upper band std multiplier"),
    lower_mult: float = Query(2.0, ge=0.0, le=10.0, description="Lower band std multiplier"),
):
    """
    Calculate a log-scale linear regression channel.
    Regression is performed on log(close), so bands represent
    proportional (percentage) deviations rather than absolute ones.
    """
    data = await _get_daily_data(symbol.upper(), outputsize="full")
    return linear_regression_channel_log(data, length=length, upper_mult=upper_mult, lower_mult=lower_mult)


# ── Preset channels ────────────────────────────────────────────────────────────

@router.get("/regression-log/{symbol}/tight", response_model=RegressionChannel)
async def get_regression_log_tight(
    symbol: str,
    timeframe: str = Query("ALL", enum=_TIMEFRAME_ENUM),
):
    """Log regression channel: multiplier ±1 (tight band)."""
    data = await _get_daily_data(symbol.upper(), outputsize="full")
    limit = _TIMEFRAME_BARS.get(timeframe)
    length = limit if limit is not None else len(data)
    return linear_regression_channel_log(data, length=length, upper_mult=1.0, lower_mult=1.0)


@router.get("/regression-log/{symbol}/fibonacci", response_model=RegressionChannel)
async def get_regression_log_fibonacci(
    symbol: str,
    timeframe: str = Query("ALL", enum=_TIMEFRAME_ENUM),
):
    """Log regression channel: multiplier ±1.618 (golden ratio band)."""
    data = await _get_daily_data(symbol.upper(), outputsize="full")
    limit = _TIMEFRAME_BARS.get(timeframe)
    length = limit if limit is not None else len(data)
    return linear_regression_channel_log(data, length=length, upper_mult=1.618, lower_mult=1.618)


@router.get("/regression-log/{symbol}/wide", response_model=RegressionChannel)
async def get_regression_log_wide(
    symbol: str,
    timeframe: str = Query("ALL", enum=_TIMEFRAME_ENUM),
):
    """Log regression channel: multiplier ±2.618 (wide Fibonacci band)."""
    data = await _get_daily_data(symbol.upper(), outputsize="full")
    limit = _TIMEFRAME_BARS.get(timeframe)
    length = limit if limit is not None else len(data)
    return linear_regression_channel_log(data, length=length, upper_mult=2.618, lower_mult=2.618)


@router.get("/sma/{symbol}")
async def get_sma(symbol: str, period: int = Query(20, ge=2, le=200)):
    """Calculate Simple Moving Average for a symbol."""
    data = await _get_daily_data(symbol.upper())
    sma = simple_moving_average(data, period)
    times = [p.time for p in data]
    return {"symbol": symbol.upper(), "period": period, "times": times, "sma": sma}


@router.get("/ema/{symbol}")
async def get_ema(symbol: str, period: int = Query(20, ge=2, le=200)):
    """Calculate Exponential Moving Average for a symbol."""
    data = await _get_daily_data(symbol.upper())
    ema = exponential_moving_average(data, period)
    times = [p.time for p in data]
    return {"symbol": symbol.upper(), "period": period, "times": times, "ema": ema}
