@echo off
echo ============================================
echo   GPA Study Hub - Production Deploy Script
echo ============================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

echo [1/5] Installing dependencies...
call npm ci --production=false
if %errorlevel% neq 0 (
    echo [ERROR] Frontend install failed
    pause
    exit /b 1
)

echo [2/5] Running TypeScript check...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo [WARN] TypeScript errors found, continuing...
)

echo [3/5] Running tests...
call npx vitest run
if %errorlevel% neq 0 (
    echo [ERROR] Tests failed
    pause
    exit /b 1
)

echo [4/5] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo [5/5] Installing server dependencies...
cd server
call npm ci --production
cd ..
if %errorlevel% neq 0 (
    echo [ERROR] Server install failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Build complete!
echo ============================================
echo.
echo To start the server:
echo   cd server ^&^& npm start
echo.
echo To start in development mode:
echo   cd server ^&^& npm run dev
echo.
pause
