# Traxlogi GPS Fleet Management - Development Startup Script
Write-Host "Starting Traxlogi GPS Fleet Management System..." -ForegroundColor Cyan

# Start Backend
Write-Host "`n[1/2] Starting NestJS Backend (port 3001)..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run start:dev" -PassThru
Write-Host "Backend started (PID: $($backend.Id))" -ForegroundColor Green

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "`n[2/2] Starting React Frontend (port 3000)..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm start" -PassThru
Write-Host "Frontend started (PID: $($frontend.Id))" -ForegroundColor Green

Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "Traxlogi is starting up!" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "Backend:   http://localhost:3001/api" -ForegroundColor White
Write-Host "TCP Port:  8808 (JT808 Protocol)" -ForegroundColor White
Write-Host "Login:     admin / admin123" -ForegroundColor White
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop" -ForegroundColor Gray

# Keep script running
try {
    while ($true) { Start-Sleep -Seconds 10 }
} finally {
    Stop-Process -Id $backend.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -ErrorAction SilentlyContinue
    Write-Host "Traxlogi stopped." -ForegroundColor Red
}
