#!/usr/bin/env pwsh
# =============================================================================
# Production Build Script — Stock View
# =============================================================================
# Frontend  → Vercel  (Next.js, auto-detected)
# Backend   → Render / Railway / Fly.io  (FastAPI + Uvicorn)
#
# Usage:
#   .\build.ps1              # build everything
#   .\build.ps1 -Frontend    # build frontend only
#   .\build.ps1 -Backend     # validate backend only
# =============================================================================

param (
    [switch]$Frontend,
    [switch]$Backend
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

# If neither flag is set, build both
if (-not $Frontend -and -not $Backend) {
    $Frontend = $true
    $Backend  = $true
}

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
    Write-Host "    [OK] $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "    [WARN] $msg" -ForegroundColor Yellow
}

function Write-Fail($msg) {
    Write-Host "    [FAIL] $msg" -ForegroundColor Red
}

# ─── FRONTEND ────────────────────────────────────────────────────────────────
if ($Frontend) {
    Write-Step "Building Next.js frontend"

    $frontendDir = Join-Path $Root "frontend"

    # Ensure npm is available
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Fail "npm not found. Install Node.js from https://nodejs.org"
        exit 1
    }

    # Check for required env var hint
    $envFile = Join-Path $frontendDir ".env.production"
    if (-not (Test-Path $envFile)) {
        Write-Warn ".env.production not found in frontend/."
        Write-Warn "Create it from frontend/.env.production.example and set NEXT_PUBLIC_API_URL."
    }

    Push-Location $frontendDir
    try {
        Write-Step "Installing frontend dependencies (clean install)"
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
        Write-Ok "Dependencies installed"

        Write-Step "Running Next.js production build"
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Next.js build failed" }
        Write-Ok "Frontend build succeeded → frontend/.next"
    }
    finally {
        Pop-Location
    }
}

# ─── BACKEND ─────────────────────────────────────────────────────────────────
if ($Backend) {
    Write-Step "Validating Python backend"

    $backendDir = Join-Path $Root "backend"

    # Check Python version
    $pythonCmd = $null
    if (Get-Command python -ErrorAction SilentlyContinue) {
        $ver = & python --version 2>&1
        if ($ver -match "Python 3\.(\d+)") {
            $minor = [int]$Matches[1]
            if ($minor -ge 11) {
                $pythonCmd = "python"
                Write-Ok "Found $ver"
            }
        }
    }
    if (-not $pythonCmd) {
        Write-Fail "Python 3.11+ is required but not found."
        exit 1
    }

    # Check for backend .env
    $backendEnv = Join-Path $backendDir ".env"
    if (-not (Test-Path $backendEnv)) {
        Write-Warn "backend/.env not found."
        Write-Warn "Copy backend/.env.example to backend/.env and set ALPHA_VANTAGE_API_KEY and CORS_ORIGINS."
    }

    # Dependency check
    Write-Step "Checking backend dependencies"
    $reqFile = Join-Path $backendDir "requirements.txt"
    & $pythonCmd -m pip install -r $reqFile --dry-run --quiet 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Some backend packages may not be installed. Run: pip install -r backend/requirements.txt"
    } else {
        Write-Ok "Backend dependencies OK"
    }

    Write-Ok "Backend validation complete"
}

# ─── DEPLOYMENT SUMMARY ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host " Deployment Targets" -ForegroundColor Magenta
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host " FRONTEND → Vercel" -ForegroundColor White
Write-Host "   1. Push repo to GitHub / GitLab / Bitbucket"
Write-Host "   2. Import project in Vercel dashboard"
Write-Host "   3. Set Root Directory to:  frontend"
Write-Host "   4. Add environment variable:"
Write-Host "        NEXT_PUBLIC_API_URL = https://<your-backend-url>"
Write-Host "   Vercel auto-detects Next.js and runs 'npm run build'."
Write-Host ""
Write-Host " BACKEND → Render  (render.yaml included)" -ForegroundColor White
Write-Host "   1. Push repo to GitHub"
Write-Host "   2. In Render dashboard → New → Web Service → connect repo"
Write-Host "   3. Set Root Directory to:  backend"
Write-Host "   4. Add environment variables from backend/.env.example"
Write-Host "        ALPHA_VANTAGE_API_KEY = <your-key>"
Write-Host "        CORS_ORIGINS          = [""https://<your-vercel-app>.vercel.app""]"
Write-Host ""
Write-Host " BACKEND → Railway  (railway.toml included)" -ForegroundColor White
Write-Host "   1. Push repo to GitHub"
Write-Host "   2. railway init  (or connect via dashboard)"
Write-Host "   3. railway up --service backend"
Write-Host "   4. Set env vars (same as above)"
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Magenta
