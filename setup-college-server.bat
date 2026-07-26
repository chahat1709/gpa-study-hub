@echo off
echo ============================================
echo   GPA Study Hub - College Server Setup
echo ============================================
echo.
echo This sets up your college PC as the server.
echo Students can access from ANYWHERE via internet.
echo.
echo Architecture (used by Google, AWS, Azure):
echo   College PC = Express API + SQLite Database
echo   Cloudflare Tunnel = Free secure tunnel to internet
echo   Students = Connect from any phone, any network
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo Download from: https://nodejs.org (LTS version)
    pause
    exit /b 1
)

echo ============================================
echo   Step 1: Install server dependencies
echo ============================================
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================
echo   Step 2: Install Cloudflare Tunnel
echo ============================================
echo.
echo Cloudflare Tunnel makes your server accessible
echo from anywhere on the internet for FREE.
echo No port forwarding needed. No static IP needed.
echo.
echo Download cloudflared from:
echo   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
echo.
echo After installing, run this command in a NEW terminal:
echo   cloudflared tunnel --url http://localhost:3000
echo.
echo It will show a URL like:
echo   https://xxxx-xx-xx-xx-xx.trycloudflare.com
echo.
echo That URL is your server's public address.
echo Copy it and share with students.
echo.

echo ============================================
echo   Step 3: Start GPA Study Hub Server
echo ============================================
echo.
echo Starting server on port 3000...
echo.
echo   Local:  http://localhost:3000
echo   Health: http://localhost:3000/api/health
echo.

node server.js
pause
