// Types re-exported from api-client for backwards compatibility
export type {
  Stock,
  ChartDataPoint,
  MarketIndex,
  StockChartResponse,
  StockOverview,
  NewsItem,
  SectorPerformance,
  SearchResult,
} from "@/lib/api-client"

// Default symbols shown in the watchlist before user customises it
export const WATCHLIST_SYMBOLS = ["ESLT", "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"]

// Fallback stock used as initial selected state while data loads
export const FALLBACK_STOCK = {
  symbol: "AAPL",
  name: "Apple Inc.",
  price: 0,
  change: 0,
  changePercent: 0,
  volume: "-",
  marketCap: "-",
  high: 0,
  low: 0,
  open: 0,
  previousClose: 0,
}
