from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    alpha_vantage_api_key: str = "demo"
    alpha_vantage_base_url: str = "https://www.alphavantage.co/query"
    cors_origins: list[str] = ["http://localhost:3000"]
    cache_ttl_seconds: int = 60  # cache market data for 60 seconds

    class Config:
        env_file = ".env"


settings = Settings()
