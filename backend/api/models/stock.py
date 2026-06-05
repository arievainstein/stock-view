from pydantic import BaseModel
from typing import Optional


class Stock(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    changePercent: float
    volume: str
    marketCap: str
    high: float
    low: float
    open: float
    previousClose: float


class ChartDataPoint(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class MarketIndex(BaseModel):
    name: str
    value: float
    change: float
    changePercent: float


class RegressionChannel(BaseModel):
    upper: list[float]
    middle: list[float]
    lower: list[float]
    times: list[str]
    pearson_r: Optional[float] = None  # correlation of log(close) vs index, −1..+1


class PeriodStats(BaseModel):
    period_change: float
    period_change_pct: float
    period_high: float
    period_low: float
    period_volume: int
    period_open: float   # first bar open for the window
    period_close: float  # last bar close for the window


class StockChartResponse(BaseModel):
    symbol: str
    data: list[ChartDataPoint]
    regression_channel: Optional[RegressionChannel] = None
    period_stats: Optional[PeriodStats] = None


class StockOverview(BaseModel):
    symbol: str
    name: str
    description: str
    sector: str
    industry: str
    employees: str
    pe_ratio: str
    eps: str
    dividend_yield: str
    week_52_high: str
    week_52_low: str
    avg_volume: str
    market_cap: str


class NewsItem(BaseModel):
    id: int
    title: str
    source: str
    url: str
    time_published: str
    summary: str
    symbol: Optional[str] = None
    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None


class SectorPerformance(BaseModel):
    name: str
    change: float
