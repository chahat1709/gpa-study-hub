@echo off
echo ============================================
echo   GPA Study Hub - College PC Server Setup
echo ============================================
echo.
echo This script sets up your college PC as the
echo GPA Study Hub server. Students can then
echo access the app from any phone on the network.
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo Download from: https://nodejs.org
    echo Choose LTS version and install.
    pause
    exit /b 1
)

echo [1/4] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [2/4] Creating uploads directory...
if not exist "uploads" mkdir uploads

echo [3/4] Starting server...
echo.
echo ============================================
echo   SERVER IS NOW RUNNING
echo ============================================
echo.
echo   Share this URL with students:
echo.
echo   Local:  http://localhost:3000
echo.

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "IP=%%a"
    set "IP=!IP: =!"
)

:: Display network IP
echo   Network: Checking...
echo.

:: Start server
echo [4/4] Server running on port 3000
echo.
echo ============================================
echo   IMPORTANT: Port Forwarding
echo ============================================
echo.
echo   For students to access from ANYWHERE:
echo   1. Open your college router settings
echo   2. Forward port 3000 to this PC's IP
echo   3. Use your college's public IP in the app
echo.
echo   For students on college WiFi only:
echo   They can connect directly using this PC's
echo   local IP (shown above).
echo.
echo   Press Ctrl+C to stop the server.
echo ============================================
echo.

node server.js
pause
