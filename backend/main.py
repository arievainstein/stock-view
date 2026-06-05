from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api.routes import stocks, market, calculations, news

app = FastAPI(
    title="Stock View API",
    description="Backend API for stock data, market indices, and technical calculations powered by Alpha Vantage.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router, prefix="/api")
app.include_router(market.router, prefix="/api")
app.include_router(calculations.router, prefix="/api")
app.include_router(news.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
