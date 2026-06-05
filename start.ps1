# start.ps1 - Start both backend and frontend in separate terminal windows

$Root = $PSScriptRoot

Write-Host "==> Starting Stock View (backend + frontend)..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-File", "$Root\start-backend.ps1" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-File", "$Root\start-frontend.ps1" -WindowStyle Normal

Write-Host "Backend : http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
