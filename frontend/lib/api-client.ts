// Server-side (SSR/ISR): Vercel injects VERCEL_URL at runtime; fall back to
// the explicit API_URL env var or localhost for local dev.
// Client-side: NEXT_PUBLIC_API_URL is baked in at build time; an empty string
// means relative URLs, which Vercel rewrites route to the Python function.
const BASE =
  typeof window === "undefined"
    ? process.env.API_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "")

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: string
  marketCap: string
  high: number
  low: number
  open: number
  previousClose: number
}

export interface ChartDataPoint {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  // regression overlay (merged client-side)
  regUpper?: number
  regMiddle?: number
  regLower?: number
}

export interface MarketIndex {
  name: string
  value: number
  change: number
  changePercent: number
}

export interface RegressionChannel {
  upper: number[]
  middle: number[]
  lower: number[]
  times: string[]
  pearson_r: number | null
}

export interface PeriodStats {
  period_change: number
  period_change_pct: number
  period_high: number
  period_low: number
  period_volume: number
  period_open: number
  period_close: number
}

export interface StockChartResponse {
  symbol: string
  data: ChartDataPoint[]
  regression_channel: RegressionChannel | null
  period_stats: PeriodStats | null
}

export interface StockOverview {
  symbol: string
  name: string
  description: string
  sector: string
  industry: string
  employees: string
  pe_ratio: string
  eps: string
  dividend_yield: string
  week_52_high: string
  week_52_low: string
  avg_volume: string
  market_cap: string
}

export interface NewsItem {
  id: number
  title: string
  source: string
  url: string
  time_published: string
  summary: string
  symbol?: string
  sentiment_label?: string
  sentiment_score?: number
}

export interface SectorPerformance {
  name: string
  change: number
}

export interface SearchResult {
  symbol: string
  name: string
  type: string
  region: string
  currency: string
}

// ── API calls ────────────────────────────────────────────────────────────────

export const api = {
  getMarketIndices: () => get<MarketIndex[]>("/api/market/indices"),
  getTopGainers: () => get<Stock[]>("/api/market/gainers"),
  getTopLosers: () => get<Stock[]>("/api/market/losers"),
  getSectorPerformance: () => get<SectorPerformance[]>("/api/market/sectors"),

  getQuote: (symbol: string) => get<Stock>(`/api/stocks/quote/${symbol}`),
  getChart: (symbol: string, interval = "daily", regression = true, timeframe = "3M") =>
    get<StockChartResponse>(
      `/api/stocks/chart/${symbol}?interval=${interval}&regression=${regression}&timeframe=${timeframe}`
    ),
  getOverview: (symbol: string) => get<StockOverview>(`/api/stocks/overview/${symbol}`),
  searchStocks: (q: string) => get<SearchResult[]>(`/api/stocks/search?q=${encodeURIComponent(q)}`),

  getLogRegressionTight: (symbol: string, timeframe = "ALL") =>
    get<RegressionChannel>(`/api/calculations/regression-log/${symbol}/tight?timeframe=${timeframe}`),
  getLogRegressionFibonacci: (symbol: string, timeframe = "ALL") =>
    get<RegressionChannel>(`/api/calculations/regression-log/${symbol}/fibonacci?timeframe=${timeframe}`),
  getLogRegressionWide: (symbol: string, timeframe = "ALL") =>
    get<RegressionChannel>(`/api/calculations/regression-log/${symbol}/wide?timeframe=${timeframe}`),

  getNews: (symbol?: string, limit = 10) =>
    get<NewsItem[]>(`/api/news?limit=${limit}${symbol ? `&symbol=${symbol}` : ""}`),
}
