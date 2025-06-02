@echo off
echo ================================================
echo KILL EVERYTHING AND START FRESH
echo ================================================

echo Killing ALL Node and Electron processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM nextjs-dev-server.exe 2>nul

echo.
echo Killing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing PID %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Waiting 3 seconds for cleanup...
timeout /t 3 /nobreak >nul

echo.
echo Cleaning builds...
if exist "dist" rmdir /s /q "dist"
if exist ".next" rmdir /s /q ".next"

echo.
echo Building main process...
npm run build:main

echo.
echo Starting Next.js on port 3000...
start /B npm run dev:renderer

echo.
echo Waiting 8 seconds for Next.js to start...
timeout /t 8 /nobreak >nul

echo.
echo Starting Electron...
electron . --no-sandbox --disable-gpu --disable-hardware-acceleration --disable-software-rasterizer --use-gl=disabled --disable-d3d11 --disable-features=VizDisplayCompositor --disable-web-security

echo.
echo Cleaning up background processes...
taskkill /F /IM node.exe 2>nul

pause