# Frontend → Backend API Mapping

This document maps every piece of data currently hard-coded / mocked in the
frontend to the backend API endpoint that should replace it.

---

## 1. Market Ticker (`components/market-ticker.tsx`)

**Current source:** `marketIndices` static array in `lib/stock-data.ts`

| Field | Type | Notes |
|---|---|---|
| `name` | string | Index display name (S&P 500, Dow Jones, NASDAQ, Russell 2000) |
| `value` | number | Current price / level |
| `change` | number | Point change from previous close |
| `changePercent` | number | Percentage change |

**Backend endpoint:** `GET /api/market/indices`

**Frontend change required:**
- On mount, fetch `/api/market/indices` and replace the static `marketIndices` import.
- Optionally poll every 60 s to stay fresh.

---

## 2. Watchlist Panel (`components/watchlist.tsx`)

### 2a. Watchlist tab
**Current source:** `watchlistStocks` static array

**Backend endpoint:** `GET /api/stocks/quote/{symbol}` (one call per symbol)

Fields returned per stock: `symbol`, `name`, `price`, `change`, `changePercent`,
`volume`, `marketCap`, `high`, `low`, `open`, `previousClose`.

### 2b. Top Gainers tab
**Current source:** `topGainers` static array

**Backend endpoint:** *(needs new endpoint)* `GET /api/market/gainers`

Returns a list of `Stock` objects sorted by `changePercent` descending (top N).
Alpha Vantage function: `TOP_GAINERS_LOSERS`.

### 2c. Top Losers tab
**Current source:** `topLosers` static array

**Backend endpoint:** *(needs new endpoint)* `GET /api/market/losers`

Returns a list of `Stock` objects sorted by `changePercent` ascending (bottom N).
Alpha Vantage function: `TOP_GAINERS_LOSERS`.

---

## 3. Stock Chart (`components/stock-chart.tsx`)

**Current source:** `generateChartData(days)` — randomly generated OHLCV data

**Backend endpoint:** `GET /api/stocks/chart/{symbol}?interval=<interval>&regression=true`

| Timeframe button | `interval` param | Notes |
|---|---|---|
| 1D | `5min` | Intraday 5-min bars |
| 1W | `30min` | Intraday 30-min bars |
| 1M | `daily` | Daily bars, compact (last 100) |
| 3M | `daily` | Daily bars, compact |
| 1Y | `daily` | Daily bars, full output |
| 5Y | `weekly` | *(needs new AV function: `TIME_SERIES_WEEKLY`)* |
| ALL | `monthly` | *(needs new AV function: `TIME_SERIES_MONTHLY`)* |

**Fields per bar:** `time`, `open`, `high`, `low`, `close`, `volume`

**Regression channel** (overlay on chart):
- `GET /api/calculations/regression/{symbol}?std_multiplier=2`
- Returns `upper[]`, `middle[]`, `lower[]`, `times[]` — one value per bar.
- Should be fetched together with chart data (or included in the chart response via `regression=true`).

---

## 4. Stock Details Panel (`components/stock-details.tsx`)

### 4a. Today's Statistics
**Current source:** fields from the passed `Stock` object (already from watchlist data)
→ No extra fetch needed once watchlist data comes from the API.

Fields used: `open`, `high`, `low`, `previousClose`, `volume`, `marketCap`.

### 4b. Key Metrics
**Current source:** Hard-coded placeholder values (`"28.45"`, `"$6.97"`, etc.)

**Backend endpoint:** *(needs new endpoint)* `GET /api/stocks/overview/{symbol}`

Alpha Vantage function: `OVERVIEW`

| Field | AV key |
|---|---|
| P/E Ratio | `PERatio` |
| EPS | `EPS` |
| Dividend Yield | `DividendYield` |
| 52W High | `52WeekHigh` |
| 52W Low | `52WeekLow` |
| Avg Volume | `10DayAverageTradingVolume` |

### 4c. Performance (1W / 1M / 3M / 1Y / YTD)
**Current source:** Hard-coded percentage values.

**Backend endpoint:** Calculate from daily chart data already fetched for the chart,
or add a helper endpoint `GET /api/stocks/performance/{symbol}` that returns
period returns computed server-side.

### 4d. About / Company Info
**Current source:** Hard-coded paragraph and sector/industry/CEO/employees fields.

**Backend endpoint:** `GET /api/stocks/overview/{symbol}` (same `OVERVIEW` call as 4b)

| Field | AV key |
|---|---|
| Description | `Description` |
| Sector | `Sector` |
| Industry | `Industry` |
| CEO | `(not available in AV — omit or use static)` |
| Employees | `FullTimeEmployees` |

---

## 5. News Feed (`components/news-feed.tsx`)

### 5a. Latest News
**Current source:** `recentNews` static array

**Backend endpoint:** *(needs new endpoint)* `GET /api/news?symbol={symbol}&limit=10`

Alpha Vantage function: `NEWS_SENTIMENT`

| Field | AV key |
|---|---|
| `title` | `title` |
| `source` | `source` |
| `time` | `time_published` (format as "Xh ago") |
| `symbol` | first ticker in `ticker_sentiment[].ticker` |
| `url` | `url` |

### 5b. Sector Performance
**Current source:** `sectors` static array

**Backend endpoint:** *(needs new endpoint)* `GET /api/market/sectors`

Alpha Vantage function: `SECTOR`

Returns performance for: Technology, Healthcare, Financials, Consumer Discretionary,
Energy, Industrials (and others). Map AV sector names → display names.

---

## 6. Order Panel (`components/order-panel.tsx`)

Uses the selected `Stock` object for price display only — no additional data fetch needed.
Order submission is a UI-only simulation (no real brokerage integration in scope).

---

## 7. Symbol Search (`components/header.tsx`)

**Current source:** No search currently wired up (button only).

**Backend endpoint:** `GET /api/stocks/search?q={query}`

Returns list of `{ symbol, name, type, region, currency }`.

---

## Summary of Endpoints Needed

| Endpoint | Status | Alpha Vantage Function |
|---|---|---|
| `GET /api/market/indices` | ✅ exists | `GLOBAL_QUOTE` on ETF proxies |
| `GET /api/stocks/quote/{symbol}` | ✅ exists | `GLOBAL_QUOTE` |
| `GET /api/stocks/chart/{symbol}` | ✅ exists | `TIME_SERIES_INTRADAY` / `TIME_SERIES_DAILY` |
| `GET /api/stocks/search` | ✅ exists | `SYMBOL_SEARCH` |
| `GET /api/calculations/regression/{symbol}` | ✅ exists | derived from daily data |
| `GET /api/calculations/sma/{symbol}` | ✅ exists | derived |
| `GET /api/calculations/ema/{symbol}` | ✅ exists | derived |
| `GET /api/market/gainers` | ❌ missing | `TOP_GAINERS_LOSERS` |
| `GET /api/market/losers` | ❌ missing | `TOP_GAINERS_LOSERS` |
| `GET /api/stocks/overview/{symbol}` | ❌ missing | `OVERVIEW` |
| `GET /api/news` | ❌ missing | `NEWS_SENTIMENT` |
| `GET /api/market/sectors` | ❌ missing | `SECTOR` |
| `GET /api/stocks/chart/{symbol}` (weekly/monthly) | ❌ missing | `TIME_SERIES_WEEKLY` / `TIME_SERIES_MONTHLY` |

---

## Frontend Changes Required

1. **Create `lib/api-client.ts`** — typed fetch wrapper pointing to `http://localhost:8000`.
2. **Replace static imports** in each component with `useEffect` + `useState` (or SWR / React Query).
3. **Add `.env.local`** to `frontend/` with `NEXT_PUBLIC_API_URL=http://localhost:8000`.
4. **Add loading / error states** to each component (skeleton placeholders already available in `ui/skeleton.tsx`).
