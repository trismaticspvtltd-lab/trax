# Traxlogi GPS Fleet Management - Production Startup Script
Write-Host "Building and starting Traxlogi for production..." -ForegroundColor Cyan

# Build Backend
Write-Host "`n[1/3] Building NestJS Backend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Backend build failed!" -ForegroundColor Red; exit 1 }

# Build Frontend
Write-Host "`n[2/3] Building React Frontend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\frontend"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend build failed!" -ForegroundColor Red; exit 1 }

# Start Backend
Write-Host "`n[3/3] Starting backend server..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
$backend = Start-Process -FilePath "node" -ArgumentList "dist/main" -PassThru -NoNewWindow
Write-Host "Backend running (PID: $($backend.Id))" -ForegroundColor Green

Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "Traxlogi is LIVE!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "API:      http://localhost:3001/api" -ForegroundColor White
Write-Host "TCP:      port 8808 (JT808)" -ForegroundColor White
Write-Host "Frontend: serve from frontend/build/" -ForegroundColor White
Write-Host "=================================" -ForegroundColor Cyan
