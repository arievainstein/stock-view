from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from config import settings
from api.routes import stocks, market, calculations, news

BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "assets"
INDEX_FILE = ASSETS_DIR / "index.html"

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

# Serve Next static chunks from the exported frontend output.
if (ASSETS_DIR / "_next").exists():
    app.mount("/_next", StaticFiles(directory=ASSETS_DIR / "_next"), name="next-static")

# Serve exported files directly when they exist, otherwise fall back to index.html.
@app.get("/{catchall:path}")
async def serve_react_app(catchall: str):
    requested_path = (ASSETS_DIR / catchall).resolve()

    if catchall and requested_path.is_file() and ASSETS_DIR in requested_path.parents:
        return FileResponse(requested_path)

    return FileResponse(INDEX_FILE)