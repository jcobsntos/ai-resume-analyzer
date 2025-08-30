# Start both frontend and backend servers
Write-Host "Starting Resume AI Analyzer servers..." -ForegroundColor Green

# Start backend in background
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\Documents\Coding Projects\Full Stack\resume-ai-analyzer\backend'; npm run dev" -PassThru

# Wait a bit for backend to start
Start-Sleep 3

# Start frontend in background  
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\Documents\Coding Projects\Full Stack\resume-ai-analyzer\frontend'; npm run dev" -PassThru

Write-Host "Both servers started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press any key to stop both servers..." -ForegroundColor Red

# Wait for user input
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop both processes
Write-Host "Stopping servers..." -ForegroundColor Yellow
if ($backend -and !$backend.HasExited) {
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
}
if ($frontend -and !$frontend.HasExited) {
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "Servers stopped." -ForegroundColor Green
