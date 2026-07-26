@echo off
title GPA Study Hub - College Server Setup
color 0A
echo.
echo  ================================================
echo   GPA Study Hub - College Server Setup
echo  ================================================
echo.
echo  This sets up your college PC as the server.
echo  Students can access from ANYWHERE via internet.
echo.
echo  Architecture (same as NITH, IITs, top colleges):
echo    College PC  = Express API + SQLite Database
echo    Tunnel      = Cloudflare (free, secure, no port forwarding)
echo    Students    = Access from any phone, any network
echo.
echo  Cost: ZERO (no AWS, no database fees, no domain)
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [X] Node.js not found.
    echo.
    echo  Install Node.js from: https://nodejs.org
    echo  Choose LTS version and run installer.
    echo.
    pause
    exit /b 1
)

echo  [OK] Node.js found
node --version
echo.

echo  ================================================
echo   Step 1: Installing server dependencies...
echo  ================================================
cd server
call npm install
if %errorlevel% neq 0 (
    echo  [X] Failed to install dependencies
    pause
    exit /b 1
)
cd ..
echo  [OK] Dependencies installed
echo.

echo  ================================================
echo   Step 2: Starting Cloudflare Tunnel...
echo  ================================================
echo.
echo  Cloudflare Tunnel makes your server accessible
echo  from anywhere on the internet for FREE.
echo.
echo  A browser window will open. Click "Try Cloudflare"
echo  to get a public URL like:
echo    https://xyz.trycloudflare.com
echo.
echo  SHARE THAT URL with students. That's their app URL.
echo.

:: Start cloudflare tunnel in background
start "GPA Hub Tunnel" cloudflared tunnel --url http://localhost:3000

:: Wait for tunnel to start
echo  Waiting for tunnel to start...
timeout /t 8 /nobreak >nul

echo.
echo  ================================================
echo   Step 3: Starting GPA Study Hub Server...
echo  ================================================
echo.
echo  Server starting on port 3000...
echo.
echo  ================================================
echo   IMPORTANT: Copy the tunnel URL shown above!
echo  ================================================
echo.
echo  Give that URL to students. They open it in the
echo  app and everything works automatically.
echo.
echo  Press Ctrl+C to stop the server.
echo  ================================================
echo.

node server.js
pause
