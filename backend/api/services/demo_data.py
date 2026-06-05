"""
Realistic demo responses shaped exactly like Alpha Vantage API responses.
Returned when ALPHA_VANTAGE_API_KEY=demo so the app works without a real key.
"""

import csv
import math
import pathlib
import random
from datetime import date, timedelta
from itertools import groupby

# ── CSV data directory ────────────────────────────────────────────────────────
# backend/data/<TICKER>.csv
DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"

# Cache parsed CSVs so we only read each file once per process lifetime.
_csv_cache: dict[str, list[tuple[str, float, float, float, float, int]] | None] = {}


def _load_csv(symbol: str) -> list[tuple[str, float, float, float, float, int]] | None:
    """
    Load a ticker CSV if present.  Returns a list of
    (date_str, close, high, low, open, volume) sorted chronologically,
    or None when the file doesn't exist.

    Expected CSV layout (Yahoo-style export):
        Row 0: Price,Close,High,Low,Open,Volume   <- column labels
        Row 1: Ticker,SYM,SYM,...                 <- ticker row  (skipped)
        Row 2: Date,,,,,                           <- label row  (skipped)
        Row 3+: 2021-06-01,124.36,125.30,...
    """
    if symbol in _csv_cache:
        return _csv_cache[symbol]

    path = DATA_DIR / f"{symbol}.csv"
    if not path.exists():
        _csv_cache[symbol] = None
        return None

    rows: list[tuple[str, float, float, float, float, int]] = []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh)
        for i, row in enumerate(reader):
            if i < 3:          # skip the 3 header rows
                continue
            if not row or not row[0].strip():
                continue
            try:
                d     = row[0].strip()
                close = float(row[1])
                high  = float(row[2])
                low   = float(row[3])
                open_ = float(row[4])
                vol   = int(float(row[5])) if len(row) > 5 and row[5].strip() else 0
                rows.append((d, close, high, low, open_, vol))
            except (ValueError, IndexError):
                continue

    rows.sort(key=lambda r: r[0])   # ensure chronological order
    _csv_cache[symbol] = rows if rows else None
    return _csv_cache[symbol]

# ── Helpers ──────────────────────────────────────────────────────────────────

# Seed so values are stable across restarts (same day = same prices)
_SEED = int(date.today().strftime("%Y%m%d"))

STOCK_META: dict[str, dict] = {
    "AAPL":  {"name": "Apple Inc.",              "base": 195.0,  "sector": "Information Technology", "industry": "Consumer Electronics"},
    "MSFT":  {"name": "Microsoft Corporation",   "base": 430.0,  "sector": "Information Technology", "industry": "Software"},
    "GOOGL": {"name": "Alphabet Inc.",            "base": 178.0,  "sector": "Communication Services", "industry": "Internet Content"},
    "AMZN":  {"name": "Amazon.com Inc.",          "base": 218.0,  "sector": "Consumer Discretionary", "industry": "Internet Retail"},
    "NVDA":  {"name": "NVIDIA Corporation",       "base": 145.0,  "sector": "Information Technology", "industry": "Semiconductors"},
    "META":  {"name": "Meta Platforms Inc.",      "base": 610.0,  "sector": "Communication Services", "industry": "Internet Content"},
    "TSLA":  {"name": "Tesla Inc.",               "base": 248.0,  "sector": "Consumer Discretionary", "industry": "Auto Manufacturers"},
    "SPY":   {"name": "SPDR S&P 500 ETF",         "base": 589.0,  "sector": "ETF", "industry": "ETF"},
    "DIA":   {"name": "SPDR Dow Jones ETF",       "base": 435.0,  "sector": "ETF", "industry": "ETF"},
    "QQQ":   {"name": "Invesco QQQ Trust",        "base": 487.0,  "sector": "ETF", "industry": "ETF"},
    "IWM":   {"name": "iShares Russell 2000 ETF", "base": 215.0,  "sector": "ETF", "industry": "ETF"},
    "AMD":   {"name": "Advanced Micro Devices",   "base": 178.0,  "sector": "Information Technology", "industry": "Semiconductors"},
    "INTC":  {"name": "Intel Corporation",        "base": 21.0,   "sector": "Information Technology", "industry": "Semiconductors"},
    "BA":    {"name": "Boeing Company",           "base": 179.0,  "sector": "Industrials",            "industry": "Aerospace & Defense"},
    "DIS":   {"name": "Walt Disney Company",      "base": 98.0,   "sector": "Communication Services", "industry": "Entertainment"},
}

OVERVIEWS: dict[str, dict] = {
    "AAPL": {
        "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
        "pe_ratio": "28.45", "eps": "6.97", "dividend_yield": "0.0052",
        "employees": "164000", "market_cap": "3080000000000",
    },
    "MSFT": {
        "description": "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
        "pe_ratio": "35.12", "eps": "12.27", "dividend_yield": "0.0072",
        "employees": "221000", "market_cap": "3210000000000",
    },
    "GOOGL": {
        "description": "Alphabet Inc. provides online advertising services, cloud computing, software, and hardware worldwide.",
        "pe_ratio": "23.80", "eps": "7.50", "dividend_yield": "0.0000",
        "employees": "182502", "market_cap": "2210000000000",
    },
    "AMZN": {
        "description": "Amazon.com Inc. engages in the retail sale of consumer products and subscriptions and web services in North America and internationally.",
        "pe_ratio": "41.00", "eps": "5.32", "dividend_yield": "0.0000",
        "employees": "1525000", "market_cap": "2280000000000",
    },
    "NVDA": {
        "description": "NVIDIA Corporation operates as a visual computing company in the United States and internationally, focusing on AI and data center chips.",
        "pe_ratio": "58.20", "eps": "2.50", "dividend_yield": "0.0003",
        "employees": "36000", "market_cap": "3580000000000",
    },
    "META": {
        "description": "Meta Platforms Inc. develops products that enable people to connect and share through mobile devices, personal computers, and VR headsets.",
        "pe_ratio": "26.10", "eps": "23.38", "dividend_yield": "0.0040",
        "employees": "74067", "market_cap": "1560000000000",
    },
    "TSLA": {
        "description": "Tesla Inc. designs, develops, manufactures, leases, and sells electric vehicles, energy generation and storage systems, and related services.",
        "pe_ratio": "65.30", "eps": "3.81", "dividend_yield": "0.0000",
        "employees": "140000", "market_cap": "791000000000",
    },
}


def _rng(symbol: str) -> random.Random:
    """Deterministic RNG seeded by today's date + symbol."""
    return random.Random(_SEED + sum(ord(c) for c in symbol))


def _price_series(symbol: str, days: int, freq: str = "D") -> list[tuple[str, float, float, float, float, int]]:
    """
    Generate (date_str, open, high, low, close, volume) tuples going back `days`.
    freq: 'D' daily, 'W' weekly, 'M' monthly, 'I' intraday (minutes)
    """
    return list()

    meta = STOCK_META.get(symbol, {"base": 100.0})
    base = meta["base"]
    rng = _rng(symbol)
    price = base
    entries = []
    today = date.today()

    if freq == "I":
        # Intraday: go back days*78 5-min bars (one trading day = 78 bars)
        from datetime import datetime, time as dt_time
        dt = datetime.combine(today, dt_time(9, 30))
        step = timedelta(minutes=5)
        n_bars = days
        for _ in range(n_bars):
            o = price
            c = o * (1 + rng.gauss(0.0001, 0.002))
            h = max(o, c) * (1 + abs(rng.gauss(0, 0.001)))
            l = min(o, c) * (1 - abs(rng.gauss(0, 0.001)))
            v = int(rng.uniform(50_000, 500_000))
            entries.append((dt.strftime("%Y-%m-%d %H:%M:%S"), o, h, l, c, v))
            price = c
            dt -= step
        return list(reversed(entries))

    # Calendar-based series
    delta = timedelta(days=7 if freq == "W" else 30 if freq == "M" else 1)
    d = today
    for _ in range(days):
        if freq == "D" and d.weekday() >= 5:  # skip weekends for daily
            d -= timedelta(days=1)
            continue
        o = price
        c = o * (1 + rng.gauss(0.0003, 0.015))
        h = max(o, c) * (1 + abs(rng.gauss(0, 0.005)))
        l = min(o, c) * (1 - abs(rng.gauss(0, 0.005)))
        v = int(rng.uniform(5_000_000, 100_000_000))
        entries.append((d.strftime("%Y-%m-%d"), o, h, l, c, v))
        price = c
        d -= delta
    return list(reversed(entries))


# ── Public demo builders ──────────────────────────────────────────────────────

def global_quote(symbol: str) -> dict:
    csv_rows = _load_csv(symbol)
    print(f"Loaded {len(csv_rows) if csv_rows else 0} CSV rows for {symbol}")
    if csv_rows and len(csv_rows) >= 2:
        # Use the last two rows for price and previous close
        prev_row = csv_rows[-2]
        last_row = csv_rows[-1]
        d_str, price, high, low, open_, vol = last_row
        prev = prev_row[1]  # previous close
        change = price - prev
        change_pct = change / prev * 100 if prev else 0
        return {
            "Global Quote": {
                "01. symbol": symbol,
                "02. open": f"{open_:.4f}",
                "03. high": f"{high:.4f}",
                "04. low": f"{low:.4f}",
                "05. price": f"{price:.4f}",
                "06. volume": str(vol),
                "07. latest trading day": d_str,
                "08. previous close": f"{prev:.4f}",
                "09. change": f"{change:.4f}",
                "10. change percent": f"{change_pct:.4f}%",
            }
        }

    meta = STOCK_META.get(symbol, {"name": symbol, "base": 50.0})
    rng = _rng(symbol)
    price = meta["base"] * (1 + rng.gauss(0.005, 0.02))
    prev = price * (1 - rng.gauss(0.003, 0.015))
    change = price - prev
    change_pct = change / prev * 100
    high = price * (1 + abs(rng.gauss(0, 0.008)))
    low = price * (1 - abs(rng.gauss(0, 0.008)))
    vol = int(rng.uniform(5_000_000, 80_000_000))
    return {
        "Global Quote": {
            "01. symbol": symbol,
            "02. open": f"{prev:.4f}",
            "03. high": f"{high:.4f}",
            "04. low": f"{low:.4f}",
            "05. price": f"{price:.4f}",
            "06. volume": str(vol),
            "07. latest trading day": date.today().strftime("%Y-%m-%d"),
            "08. previous close": f"{prev:.4f}",
            "09. change": f"{change:.4f}",
            "10. change percent": f"{change_pct:.4f}%",
        }
    }


def time_series_daily(symbol: str, outputsize: str = "compact") -> dict:
    csv_rows = _load_csv(symbol)
    if csv_rows:
        limit = len(csv_rows) if outputsize == "full" else min(100, len(csv_rows))
        rows = csv_rows[-limit:]
        series = {
            r[0]: {"1. open": f"{r[4]:.4f}", "2. high": f"{r[2]:.4f}",
                   "3. low": f"{r[3]:.4f}", "4. close": f"{r[1]:.4f}",
                   "5. volume": str(r[5])}
            for r in rows
        }
        return {"Meta Data": {"2. Symbol": symbol}, "Time Series (Daily)": series}

    days = 500 if outputsize == "full" else 100
    rows = _price_series(symbol, days, "D")
    series = {
        r[0]: {"1. open": f"{r[1]:.4f}", "2. high": f"{r[2]:.4f}",
               "3. low": f"{r[3]:.4f}", "4. close": f"{r[4]:.4f}",
               "5. volume": str(r[5])}
        for r in rows
    }
    return {"Meta Data": {"2. Symbol": symbol}, "Time Series (Daily)": series}


def time_series_intraday(symbol: str, interval: str = "5min") -> dict:
    bars = 78  # one full trading day
    rows = _price_series(symbol, bars, "I")
    key = f"Time Series ({interval})"
    series = {
        r[0]: {"1. open": f"{r[1]:.4f}", "2. high": f"{r[2]:.4f}",
               "3. low": f"{r[3]:.4f}", "4. close": f"{r[4]:.4f}",
               "5. volume": str(r[5])}
        for r in rows
    }
    return {"Meta Data": {"2. Symbol": symbol}, key: series}


def _resample_to_weekly(daily_rows: list) -> list:
    """Aggregate daily CSV rows into weekly OHLCV bars (week ending Friday)."""
    from datetime import datetime
    def week_key(row):
        d = datetime.strptime(row[0], "%Y-%m-%d")
        # ISO week: return the Friday of that week as the bar date
        friday = d + timedelta(days=(4 - d.weekday()) % 7)
        return friday.strftime("%Y-%m-%d")

    result = []
    for wk, grp in groupby(daily_rows, key=week_key):
        bars = list(grp)
        result.append((
            wk,
            bars[-1][1],                    # close = last day's close
            max(r[2] for r in bars),        # high
            min(r[3] for r in bars),        # low
            bars[0][4],                     # open = first day's open
            sum(r[5] for r in bars),        # volume
        ))
    return result


def _resample_to_monthly(daily_rows: list) -> list:
    """Aggregate daily CSV rows into monthly OHLCV bars."""
    def month_key(row):
        return row[0][:7]   # 'YYYY-MM'

    result = []
    for mo, grp in groupby(daily_rows, key=month_key):
        bars = list(grp)
        last_date = bars[-1][0]
        result.append((
            last_date,
            bars[-1][1],
            max(r[2] for r in bars),
            min(r[3] for r in bars),
            bars[0][4],
            sum(r[5] for r in bars),
        ))
    return result


def time_series_weekly(symbol: str) -> dict:
    csv_rows = _load_csv(symbol)
    if csv_rows:
        rows = _resample_to_weekly(csv_rows)
        series = {
            r[0]: {"1. open": f"{r[4]:.4f}", "2. high": f"{r[2]:.4f}",
                   "3. low": f"{r[3]:.4f}", "4. close": f"{r[1]:.4f}",
                   "5. volume": str(r[5])}
            for r in rows
        }
        return {"Meta Data": {"2. Symbol": symbol}, "Weekly Time Series": series}

    rows = _price_series(symbol, 260, "W")
    series = {
        r[0]: {"1. open": f"{r[1]:.4f}", "2. high": f"{r[2]:.4f}",
               "3. low": f"{r[3]:.4f}", "4. close": f"{r[4]:.4f}",
               "5. volume": str(r[5])}
        for r in rows
    }
    return {"Meta Data": {"2. Symbol": symbol}, "Weekly Time Series": series}


def time_series_monthly(symbol: str) -> dict:
    csv_rows = _load_csv(symbol)
    if csv_rows:
        rows = _resample_to_monthly(csv_rows)
        series = {
            r[0]: {"1. open": f"{r[4]:.4f}", "2. high": f"{r[2]:.4f}",
                   "3. low": f"{r[3]:.4f}", "4. close": f"{r[1]:.4f}",
                   "5. volume": str(r[5])}
            for r in rows
        }
        return {"Meta Data": {"2. Symbol": symbol}, "Monthly Time Series": series}

    rows = _price_series(symbol, 120, "M")
    series = {
        r[0]: {"1. open": f"{r[1]:.4f}", "2. high": f"{r[2]:.4f}",
               "3. low": f"{r[3]:.4f}", "4. close": f"{r[4]:.4f}",
               "5. volume": str(r[5])}
        for r in rows
    }
    return {"Meta Data": {"2. Symbol": symbol}, "Monthly Time Series": series}


def _csv_symbols() -> dict[str, str]:
    """Return {symbol: display_name} for all CSV files found in DATA_DIR."""
    result = {}
    if DATA_DIR.exists():
        for p in DATA_DIR.glob("*.csv"):
            sym = p.stem.upper()
            result[sym] = STOCK_META.get(sym, {}).get("name", sym)
    return result


def symbol_search(keywords: str) -> dict:
    kw = keywords.upper()

    # Combine built-in STOCK_META with any CSV-backed symbols
    all_symbols: dict[str, dict] = {}
    for sym, meta in STOCK_META.items():
        all_symbols[sym] = meta
    for sym, name in _csv_symbols().items():
        if sym not in all_symbols:
            all_symbols[sym] = {"name": name, "sector": "Equity", "industry": "N/A"}

    matches = [
        {
            "1. symbol": sym,
            "2. name": meta["name"],
            "3. type": "ETF" if meta.get("sector") == "ETF" else "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-04",
            "8. currency": "USD",
            "9. matchScore": "1.0000",
        }
        for sym, meta in all_symbols.items()
        if kw in sym or kw in meta["name"].upper()
    ]
    return {"bestMatches": matches[:8]}


def overview(symbol: str) -> dict:
    meta = STOCK_META.get(symbol, {"name": symbol, "base": 100.0, "sector": "N/A", "industry": "N/A"})
    ov = OVERVIEWS.get(symbol, {
        "description": f"{meta['name']} is a publicly traded company.",
        "pe_ratio": "N/A", "eps": "N/A", "dividend_yield": "0",
        "employees": "N/A", "market_cap": "N/A",
    })

    # Use real price data from CSV when available
    csv_rows = _load_csv(symbol)
    if csv_rows:
        closes = [r[1] for r in csv_rows]
        price = closes[-1]
        week52_high = max(closes[-252:]) if len(closes) >= 252 else max(closes)
        week52_low  = min(closes[-252:]) if len(closes) >= 252 else min(closes)
        avg_vol = int(sum(r[5] for r in csv_rows[-10:]) / min(10, len(csv_rows)))
    else:
        rng = _rng(symbol)
        price = meta["base"] * (1 + rng.gauss(0.005, 0.02))
        week52_high = price * 1.22
        week52_low  = price * 0.68
        avg_vol = int(rng.uniform(20_000_000, 90_000_000))

    return {
        "Symbol": symbol,
        "Name": meta["name"],
        "Description": ov["description"],
        "Sector": meta["sector"],
        "Industry": meta["industry"],
        "FullTimeEmployees": ov["employees"],
        "PERatio": ov["pe_ratio"],
        "EPS": ov["eps"],
        "DividendYield": ov["dividend_yield"],
        "52WeekHigh": f"{week52_high:.2f}",
        "52WeekLow": f"{week52_low:.2f}",
        "10DayAverageTradingVolume": str(avg_vol),
        "MarketCapitalization": ov["market_cap"],
    }


def top_gainers_losers() -> dict:
    rng = random.Random(_SEED)
    gainers = []
    losers = []
    candidates = list(STOCK_META.keys())
    rng.shuffle(candidates)
    for sym in candidates[:5]:
        meta = STOCK_META[sym]
        price = meta["base"] * (1 + rng.uniform(0.03, 0.12))
        pct = rng.uniform(3.0, 12.0)
        gainers.append({"ticker": sym, "price": f"{price:.2f}", "change_amount": f"{price*pct/100:.2f}", "change_percentage": f"{pct:.2f}%", "volume": str(int(rng.uniform(5e6, 80e6)))})
    for sym in candidates[5:10]:
        meta = STOCK_META[sym]
        price = meta["base"] * (1 - rng.uniform(0.03, 0.10))
        pct = rng.uniform(-10.0, -2.0)
        losers.append({"ticker": sym, "price": f"{price:.2f}", "change_amount": f"{price*pct/100:.2f}", "change_percentage": f"{pct:.2f}%", "volume": str(int(rng.uniform(5e6, 80e6)))})
    return {"top_gainers": gainers, "top_losers": losers, "most_actively_traded": gainers[:3]}


def sector_performance() -> dict:
    rng = random.Random(_SEED)
    sectors = [
        "Information Technology", "Health Care", "Financials",
        "Consumer Discretionary", "Energy", "Industrials",
        "Communication Services", "Consumer Staples", "Utilities",
        "Real Estate", "Materials",
    ]
    perf = {s: f"{rng.uniform(-2.5, 3.5):.2f}%" for s in sectors}
    return {"Rank A: Real-Time Performance": perf}


def get_demo_response(params: dict) -> dict:
    # print(f"Demo data requested with params: {params}")
    """Route a params dict to the appropriate demo builder."""
    fn = params.get("function", "")
    symbol = params.get("symbol", "AAPL").upper()
    outputsize = params.get("outputsize", "compact")
    interval = params.get("interval", "5min")
    keywords = params.get("keywords", "AAPL")
    tickers = params.get("tickers", symbol)
    limit = int(params.get("limit", 10))

    if fn == "GLOBAL_QUOTE":
        return global_quote(symbol)
    elif fn == "TIME_SERIES_DAILY":
        return time_series_daily(symbol, outputsize)
    elif fn == "TIME_SERIES_DAILY_ADJUSTED":
        return time_series_daily(symbol, outputsize)
    elif fn == "TIME_SERIES_INTRADAY":
        return time_series_intraday(symbol, interval)
    elif fn == "TIME_SERIES_WEEKLY":
        return time_series_weekly(symbol)
    elif fn == "TIME_SERIES_WEEKLY_ADJUSTED":
        return time_series_weekly(symbol)
    elif fn == "TIME_SERIES_MONTHLY":
        return time_series_monthly(symbol)
    elif fn == "TIME_SERIES_MONTHLY_ADJUSTED":
        return time_series_monthly(symbol)
    elif fn == "SYMBOL_SEARCH":
        return symbol_search(keywords)
    elif fn == "OVERVIEW":
        return overview(symbol)
    elif fn == "TOP_GAINERS_LOSERS":
        return top_gainers_losers()
    elif fn == "SECTOR":
        return sector_performance()
    elif fn == "NEWS_SENTIMENT":
        sym = tickers if tickers != symbol or "tickers" in params else None
        return news_sentiment(sym, limit)
    else:
        return {}


def news_sentiment(symbol: str | None = None, limit: int = 10) -> dict:
    headlines = [
        ("NVDA", "NVIDIA Reports Record Revenue Driven by AI Chip Demand", "Reuters"),
        ("AAPL", "Apple Unveils New AI Features for Next iPhone Lineup", "Bloomberg"),
        ("TSLA", "Tesla Expands Supercharger Network Across Europe and Asia", "CNBC"),
        ("MSFT", "Microsoft Azure Cloud Growth Exceeds Wall Street Expectations", "WSJ"),
        ("AMZN", "Amazon Prime Day Sets New All-Time Sales Record", "MarketWatch"),
        ("META", "Meta Reports Strong Ad Revenue Growth in Q2 Earnings", "Reuters"),
        ("GOOGL", "Alphabet Announces $70B Share Buyback Program", "Bloomberg"),
        ("NVDA", "AI Infrastructure Boom Fuels Semiconductor Sector Rally", "CNBC"),
        ("AAPL", "Apple Services Revenue Hits Record $24B This Quarter", "WSJ"),
        ("MSFT", "Microsoft Copilot Reaches 100 Million Enterprise Users", "TechCrunch"),
        ("AMZN", "AWS Launches New AI-Powered Data Analytics Platform", "Reuters"),
        ("TSLA", "Tesla FSD Beta Now Available in 15 New Countries", "Electrek"),
    ]
    from datetime import datetime
    now = datetime.utcnow()
    feed = []
    for i, (sym, title, source) in enumerate(headlines[:limit]):
        if symbol and sym != symbol:
            continue
        ts = (now - timedelta(hours=i * 2 + 1)).strftime("%Y%m%dT%H%M%S")
        feed.append({
            "title": title,
            "url": f"https://example.com/news/{i}",
            "time_published": ts,
            "source": source,
            "summary": title + ". Full details available in the complete article.",
            "ticker_sentiment": [{"ticker": sym, "ticker_sentiment_label": "Bullish", "ticker_sentiment_score": "0.35"}],
        })
    return {"feed": feed[:limit]}
