# start-frontend.ps1 - Install dependencies and start the Next.js frontend

$FrontendDir = "$PSScriptRoot\frontend"

Write-Host "==> Setting up frontend..." -ForegroundColor Cyan

Set-Location $FrontendDir

# # Ensure pnpm is available
# if (-Not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
#     Write-Host "pnpm not found. Installing via npm..." -ForegroundColor Yellow
#     npm install -g pnpm
# }

# # Install node modules if needed
# if (-Not (Test-Path "$FrontendDir\node_modules")) {
#     Write-Host "Installing npm packages with pnpm..." -ForegroundColor Yellow
#     pnpm install
# }

# Start the dev server
Write-Host "Starting frontend at http://localhost:3000 ..." -ForegroundColor Green
npm run dev
