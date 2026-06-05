from fastapi import APIRouter, HTTPException
from api.models.stock import MarketIndex, Stock, SectorPerformance
from api.services import alpha_vantage

router = APIRouter(prefix="/market", tags=["market"])

# Map index names to tradeable ETF symbols available on Alpha Vantage
INDEX_SYMBOLS = {
    "S&P 500": "SPY",
    "Dow Jones": "DIA",
    "NASDAQ": "QQQ",
    "Russell 2000": "IWM",
}

# Alpha Vantage sector name → display name
SECTOR_NAME_MAP = {
    "Information Technology": "Technology",
    "Health Care": "Healthcare",
    "Financials": "Financials",
    "Consumer Discretionary": "Consumer",
    "Energy": "Energy",
    "Industrials": "Industrials",
    "Communication Services": "Communication",
    "Consumer Staples": "Staples",
    "Utilities": "Utilities",
    "Real Estate": "Real Estate",
    "Materials": "Materials",
}


@router.get("/indices", response_model=list[MarketIndex])
async def get_market_indices():
    """Get current values for major market indices (via ETF proxies)."""
    results = []
    for name, symbol in INDEX_SYMBOLS.items():
        try:
            quote = await alpha_vantage.get_quote(symbol)
            if not quote or "05. price" not in quote:
                continue
            value = float(quote.get("05. price", 0))
            change = float(quote.get("09. change", 0))
            change_pct = float(quote.get("10. change percent", "0%").replace("%", ""))
            results.append(MarketIndex(name=name, value=value, change=change, changePercent=change_pct))
        except Exception:
            continue
    return results


def _parse_mover(item: dict) -> Stock:
    price = float(item.get("price", 0))
    change_pct_str = item.get("change_percentage", "0%").replace("%", "")
    change_pct = float(change_pct_str)
    change = round(price * change_pct / 100, 2)
    volume_raw = int(item.get("volume", 0))
    volume_str = (
        f"{volume_raw / 1_000_000:.1f}M" if volume_raw >= 1_000_000
        else f"{volume_raw / 1_000:.1f}K" if volume_raw >= 1_000
        else str(volume_raw)
    )
    return Stock(
        symbol=item.get("ticker", ""),
        name=item.get("ticker", ""),
        price=price,
        change=change,
        changePercent=change_pct,
        volume=volume_str,
        marketCap="N/A",
        high=price,
        low=price,
        open=price,
        previousClose=round(price - change, 2),
    )


@router.get("/gainers", response_model=list[Stock])
async def get_top_gainers():
    """Get today's top gaining stocks."""
    data = await alpha_vantage.get_top_gainers_losers()
    gainers = data.get("top_gainers", [])
    return [_parse_mover(g) for g in gainers]


@router.get("/losers", response_model=list[Stock])
async def get_top_losers():
    """Get today's top losing stocks."""
    data = await alpha_vantage.get_top_gainers_losers()
    losers = data.get("top_losers", [])
    return [_parse_mover(l) for l in losers]


@router.get("/sectors", response_model=list[SectorPerformance])
async def get_sector_performance():
    """Get today's sector performance."""
    data = await alpha_vantage.get_sector_performance()
    # Use "Rank A: Real-Time Performance"
    realtime = data.get("Rank A: Real-Time Performance", {})
    results = []
    for av_name, pct_str in realtime.items():
        display = SECTOR_NAME_MAP.get(av_name, av_name)
        try:
            pct = float(pct_str.replace("%", ""))
        except (ValueError, AttributeError):
            pct = 0.0
        results.append(SectorPerformance(name=display, change=pct))
    return results
