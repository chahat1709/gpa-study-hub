@echo off
setlocal enabledelayedexpansion
echo ==================================================
echo   GPA Study Hub - Professional Deploy Pipeline
echo ==================================================
echo.

where node >nul 2>nul || (echo [FAIL] Node.js not found & pause & exit /b 1)

echo [1/6] Env validation...
if exist "scripts\validate-env.js" (
  node scripts\validate-env.js || (pause & exit /b 1)
)

echo [2/6] Install frontend deps (ci)...
call npm ci || (echo [FAIL] npm ci & pause & exit /b 1)

echo [3/6] Type check...
call npm run check || (echo [FAIL] tsc & pause & exit /b 1)

echo [4/6] Tests (155)...
call npm test || (echo [FAIL] tests & pause & exit /b 1)

echo [5/6] Build frontend...
call npm run build || (echo [FAIL] build & pause & exit /b 1)

echo [6/6] Install server deps...
pushd server
call npm ci --omit=dev || (echo [FAIL] server ci & popd & pause & exit /b 1)
popd

echo.
echo ==================================================
echo   Build complete! Artifacts: dist/
echo ==================================================
echo   Start locally:  start-server.bat
echo   Or PM2:         pm2 start ecosystem.config.js --env production
echo   Health:         http://localhost:3000/api/health
echo   Backup:         node scripts/backup.js
echo ==================================================
pause
