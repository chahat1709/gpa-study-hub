@echo off
setlocal enabledelayedexpansion
title GPA Study Hub - Server

echo ==================================================
echo   GPA Study Hub - College Server (Professional)
echo ==================================================
echo.

:: --- 1. Node.js check (require 20+) ---
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [FAIL] Node.js not found. Install LTS from https://nodejs.org
  pause & exit /b 1
)
for /f "tokens=1" %%v in ('node -v') do set NODEV=%%v
echo [OK] Node !NODEV! found

:: --- 2. Env validation ---
if not exist "server\.env" (
  if not exist ".env" (
    echo [WARN] No .env found. Copy server\.env.example to server\.env and set JWT_SECRET + ADMIN_CODE
    echo        See server\.env.example for template
  )
)
if exist "scripts\validate-env.js" (
  node scripts\validate-env.js
  if %errorlevel% neq 0 pause & exit /b 1
)

:: --- 3. Install deps (ci) ---
echo.
echo [1/3] Installing dependencies...
if not exist "server\node_modules" (
  pushd server
  call npm ci
  if %errorlevel% neq 0 echo [FAIL] npm ci failed & popd & pause & exit /b 1
  popd
) else (
  echo [OK] server\node_modules exists (skip, run "cd server && npm ci" to refresh)
)
if not exist "logs" mkdir logs

:: --- 4. Start server via PM2 or node ---
echo.
echo [2/3] Starting server...
where pm2 >nul 2>nul
if %errorlevel% equ 0 (
  echo [INFO] Using PM2
  call pm2 start ecosystem.config.js --env production --update-env
  if %errorlevel% neq 0 echo [FAIL] pm2 start failed & pause & exit /b 1
  call pm2 save >nul 2>nul
  echo [OK] PM2 started. Logs: pm2 logs gpa-study-hub-server
) else (
  echo [INFO] PM2 not found (npm i -g pm2 for auto-restart). Starting with node...
  start "GPA Hub Server" /min cmd /c "node server/server.js >> logs\out.log 2>> logs\error.log"
)

:: --- 5. Health poll (max 30s) ---
echo [INFO] Waiting for health check...
set /a tries=0
:healthloop
set /a tries+=1
curl -s http://localhost:3000/api/health >nul 2>nul
if %errorlevel% equ 0 goto :healthy
if %tries% geq 30 (
  echo [FAIL] Server not healthy after 30s. Check logs\error.log and http://localhost:3000/api/health
  pause & exit /b 1
)
timeout /t 1 /nobreak >nul
goto :healthloop
:healthy
echo [OK] Server healthy at http://localhost:3000/api/health

:: --- 6. Cloudflare Tunnel (optional) ---
where cloudflared >nul 2>nul
if %errorlevel% equ 0 (
  echo.
  echo [3/3] Starting Cloudflare Tunnel...
  echo [INFO] Tunnel will print a https URL. Share it with students as VITE_API_URL
  start "GPA Hub Tunnel" cloudflared tunnel --url http://localhost:3000
) else (
  echo.
  echo [INFO] cloudflared not found. For internet access:
  echo        1. Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  echo        2. Run: cloudflared tunnel --url http://localhost:3000
  echo        3. Share the https URL with students
  echo [INFO] Without tunnel, app works on college WiFi via http://^<this PC IP^>:3000
)

:: --- 7. Print URLs ---
echo.
echo ==================================================
echo   Server ready!
echo ==================================================
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
  set "IP=%%a"
  set "IP=!IP: =!"
  if not "!IP!"=="" echo   Network: http://!IP!:3000
)
echo   Local:   http://localhost:3000
echo   Health:  http://localhost:3000/api/health
echo   Metrics: http://localhost:3000/api/metrics (admin only)
echo   Logs:    logs\out.log / logs\error.log  (or pm2 logs)
echo.
echo Press Ctrl+C in this window to stop tunnel. Server keeps running via PM2.
echo To stop server: pm2 stop gpa-study-hub-server
echo ==================================================
pause
