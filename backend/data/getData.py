import sys
import yfinance as yf
# Download 5 years of daily data for Apple
data = yf.download(sys.argv[1], period="5y", interval="1d")
# Save to CSV
data.to_csv(f"{sys.argv[1]}.csv")