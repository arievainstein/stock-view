# start-backend.ps1 - Set up and start the Python backend

$BackendDir = "$PSScriptRoot\backend"

Write-Host "==> Setting up backend..." -ForegroundColor Cyan

# Create virtual environment if it doesn't exist
if (-Not (Test-Path "$BackendDir\.venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv "$BackendDir\.venv"
}

# Activate venv
& "$BackendDir\.venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r "$BackendDir\requirements.txt" --quiet

# Copy .env.example to .env if .env doesn't exist
if (-Not (Test-Path "$BackendDir\.env")) {
    Copy-Item "$BackendDir\.env.example" "$BackendDir\.env"
    Write-Host ""
    Write-Host "  !! Created backend\.env from .env.example" -ForegroundColor Red
    Write-Host "  !! Set your ALPHA_VANTAGE_API_KEY in backend\.env before using real data." -ForegroundColor Red
    Write-Host ""
}

# Start the API server
Write-Host "Starting backend API at http://localhost:8000 ..." -ForegroundColor Green
Set-Location $BackendDir
uvicorn main:app --reload --host 0.0.0.0 --port 8000
