@echo off
:: ProxTop Startup Helper
:: This script provides multiple startup modes for different system configurations

echo ================================================
echo ProxTop - Proxmox Desktop Manager
echo ================================================
echo.
echo Choose a startup mode:
echo.
echo 1. Standard Mode (Recommended)
echo 2. Safe Mode (For GPU Issues)
echo 3. Minimal Mode (Ultra Safe)
echo 4. Debug Mode (For Troubleshooting)
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto standard
if "%choice%"=="2" goto safe
if "%choice%"=="3" goto minimal
if "%choice%"=="4" goto debug
if "%choice%"=="5" goto exit
goto invalid

:standard
echo.
echo Starting ProxTop in Standard Mode...
echo This disables GPU acceleration for stability.
echo.
npm run start
goto end

:safe
echo.
echo Starting ProxTop in Safe Mode...
echo This mode disables all hardware acceleration and uses maximum compatibility.
echo.
npm run start:safe
goto end

:minimal
echo.
echo Starting ProxTop in Minimal Mode...
echo This mode uses a single process and minimal features for maximum stability.
echo.
npm run start:minimal
goto end

:debug
echo.
echo Starting ProxTop in Debug Mode...
echo This mode enables logging and debugging features.
echo Check the console for detailed information.
echo.
npm run start:debug
goto end

:invalid
echo.
echo Invalid choice. Please enter a number between 1-5.
echo.
pause
goto start

:exit
echo.
echo Exiting...
goto end

:end
if errorlevel 1 (
    echo.
    echo ================================================
    echo ProxTop encountered an error!
    echo ================================================
    echo.
    echo Common solutions:
    echo 1. Try running in Safe Mode
    echo 2. Update your graphics drivers
    echo 3. Run as Administrator
    echo 4. Check if Node.js is properly installed
    echo.
    echo If problems persist, try:
    echo npm run start:safe
    echo.
    pause
)