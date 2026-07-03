@echo off
echo ======================================
echo   OPNChia - Setup and Run
echo ======================================
echo.

echo [1/4] Pulling latest code from GitHub...
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git pull failed. Make sure you're in the OPNChia folder.
    pause
    exit /b
)
echo Done!
echo.

echo [2/4] Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed.
    pause
    exit /b
)
echo Done!
echo.

echo [3/4] Starting development server...
echo.
echo Open http://localhost:3000 in your browser
echo Press Ctrl+C to stop the server
echo.
call npm run dev

pause
