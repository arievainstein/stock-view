from fastapi import APIRouter, Query
import logging
from api.models.stock import NewsItem
from api.services import alpha_vantage
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/news", tags=["news"])


def _format_relative_time(time_published: str) -> str:
    """Convert AV timestamp (YYYYMMDDTHHMMSS) to relative time string."""
    try:
        dt = datetime.strptime(time_published, "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        diff = now - dt
        hours = int(diff.total_seconds() // 3600)
        if hours < 1:
            minutes = int(diff.total_seconds() // 60)
            return f"{minutes}m ago"
        if hours < 24:
            return f"{hours}h ago"
        days = hours // 24
        return f"{days}d ago"
    except Exception:
        return time_published


@router.get("", response_model=list[NewsItem])
async def get_news(
    symbol: str | None = Query(None, description="Filter by stock symbol"),
    limit: int = Query(10, ge=1, le=50),
):
    """Get latest market news, optionally filtered by symbol."""
    logger.info("News request received for symbol=%s limit=%s", symbol, limit)
    data = await alpha_vantage.get_news_sentiment(symbol=symbol, limit=limit)
    feed = data.get("feed", [])
    items = []
    for i, article in enumerate(feed[:limit]):
        tickers = article.get("ticker_sentiment", [])
        primary_symbol = tickers[0]["ticker"] if tickers else symbol

        # Sentiment from first matched ticker
        sentiment_label = None
        sentiment_score = None
        if tickers:
            sentiment_label = tickers[0].get("ticker_sentiment_label")
            try:
                sentiment_score = float(tickers[0].get("ticker_sentiment_score", 0))
            except (ValueError, TypeError):
                pass

        items.append(
            NewsItem(
                id=i + 1,
                title=article.get("title", ""),
                source=article.get("source", ""),
                url=article.get("url", "#"),
                time_published=_format_relative_time(article.get("time_published", "")),
                summary=article.get("summary", ""),
                symbol=primary_symbol,
                sentiment_label=sentiment_label,
                sentiment_score=sentiment_score,
            )
        )
    return items
