@echo off
echo ================================================
echo PROXTOP ULTRA-SAFE START
echo ================================================
echo.

echo Stoppe alle Electron-Prozesse...
taskkill /F /IM electron.exe 2>nul

echo.
echo Starte mit maximaler Kompatibilität...
echo.

:: Ultra-Safe Mode mit allen erdenklichen Flags
electron . ^
  --disable-gpu ^
  --disable-hardware-acceleration ^
  --disable-software-rasterizer ^
  --disable-gpu-sandbox ^
  --disable-gpu-process-crash-limit ^
  --disable-web-security ^
  --disable-features=VizDisplayCompositor ^
  --no-sandbox ^
  --single-process ^
  --disable-renderer-backgrounding ^
  --disable-background-timer-throttling ^
  --disable-backgrounding-occluded-windows ^
  --disable-ipc-flooding-protection ^
  --force-color-profile=srgb ^
  --disable-accelerated-2d-canvas ^
  --disable-accelerated-jpeg-decoding ^
  --disable-accelerated-mjpeg-decode ^
  --disable-accelerated-video-decode ^
  --disable-accelerated-video-encode ^
  --disable-dev-shm-usage

echo.
if errorlevel 1 (
    echo FEHLER beim Start!
    echo Versuche Fallback-Modus...
    echo.
    
    :: Noch extremerer Fallback
    electron . --no-sandbox --single-process --disable-gpu
)

pause