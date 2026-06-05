# update-stocks.ps1 - Set up and update stocks

$BackendDir = "$PSScriptRoot\backend"
$DataDir = "$BackendDir\data"

Write-Host "==> Setting up..." -ForegroundColor Cyan

# Create virtual environment if it doesn't exist
if (-Not (Test-Path "$BackendDir\.venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv "$BackendDir\.venv"
}

# Activate venv
& "$BackendDir\.venv\Scripts\Activate.ps1"

# Updating stocks
Write-Host "Updating stocks data..." -ForegroundColor Green
Set-Location $DataDir

# Get list of all *csv in the folder
$csvFiles = Get-ChildItem -Path $DataDir -Filter "*.csv"
if ($csvFiles.Count -eq 0) {
    Write-Host "No CSV files found in $DataDir. Please add stock data CSVs before running this script." -ForegroundColor Red
    exit 1
}

# For each CSV file, run the getData.py script to update it
foreach ($csv in $csvFiles) {
    $csvNameWithoutExtension = [System.IO.Path]::GetFileNameWithoutExtension($csv.Name)
    Write-Host "Updating data for $csvNameWithoutExtension..." -ForegroundColor Yellow
    python getData.py $csvNameWithoutExtension
}

$SetLocation $PSScriptRoot
Write-Host "Stock data update complete!" -ForegroundColor Green