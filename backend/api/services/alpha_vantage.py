import httpx
import time
from functools import lru_cache
from typing import Any
from config import settings
from api.services import demo_data

# Simple in-memory cache
_cache: dict[str, tuple[Any, float]] = {}


def _cache_get(key: str) -> Any | None:
    if key in _cache:
        value, ts = _cache[key]
        if time.time() - ts < settings.cache_ttl_seconds:
            return value
        del _cache[key]
    return None


def _cache_set(key: str, value: Any) -> None:
    _cache[key] = (value, time.time())


async def fetch_alpha_vantage(params: dict) -> dict:
    #print(f"API key: {settings.alpha_vantage_api_key}")
    if settings.alpha_vantage_api_key == "demo":
        return demo_data.get_demo_response(params)

    params["apikey"] = settings.alpha_vantage_api_key
    cache_key = str(sorted(params.items()))
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    async with httpx.AsyncClient() as client:
        response = await client.get(settings.alpha_vantage_base_url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
    _cache_set(cache_key, data)
    return data


async def get_quote(symbol: str) -> dict:
    """Fetch real-time quote for a single symbol."""
    data = await fetch_alpha_vantage({"function": "GLOBAL_QUOTE", "symbol": symbol})
    return data.get("Global Quote", {})


async def get_intraday(symbol: str, interval: str = "5min") -> dict:
    """Fetch intraday time series data."""
    data = await fetch_alpha_vantage({
        "function": "TIME_SERIES_INTRADAY",
        "symbol": symbol,
        "interval": interval,
        "outputsize": "compact",
    })
    return data


async def get_daily(symbol: str, outputsize: str = "compact") -> dict:
    """Fetch daily adjusted time series data."""
    data = await fetch_alpha_vantage({
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "outputsize": outputsize,
    })
    return data


async def search_symbol(keywords: str) -> list[dict]:
    """Search for symbols matching the given keywords."""
    data = await fetch_alpha_vantage({"function": "SYMBOL_SEARCH", "keywords": keywords})
    return data.get("bestMatches", [])


async def get_market_index_quote(symbol: str) -> dict:
    """Fetch quote for a market index ETF/symbol."""
    return await get_quote(symbol)


async def get_weekly(symbol: str) -> dict:
    """Fetch weekly adjusted time series data."""
    return await fetch_alpha_vantage({"function": "TIME_SERIES_WEEKLY", "symbol": symbol})


async def get_monthly(symbol: str) -> dict:
    """Fetch monthly adjusted time series data."""
    return await fetch_alpha_vantage({"function": "TIME_SERIES_MONTHLY", "symbol": symbol})


async def get_top_gainers_losers() -> dict:
    """Fetch top gainers, losers, and most active tickers."""
    return await fetch_alpha_vantage({"function": "TOP_GAINERS_LOSERS"})


async def get_overview(symbol: str) -> dict:
    """Fetch company overview (fundamentals) for a symbol."""
    return await fetch_alpha_vantage({"function": "OVERVIEW", "symbol": symbol})


async def get_news_sentiment(symbol: str | None = None, limit: int = 10) -> dict:
    """Fetch news & sentiment. Optionally filter by ticker."""
    params: dict = {"function": "NEWS_SENTIMENT", "limit": limit, "sort": "LATEST"}
    if symbol:
        params["tickers"] = symbol
    return await fetch_alpha_vantage(params)


async def get_sector_performance() -> dict:
    """Fetch sector performance data."""
    return await fetch_alpha_vantage({"function": "SECTOR"})
