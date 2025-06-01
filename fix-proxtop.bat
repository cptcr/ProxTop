@echo off
echo ================================================
echo ProxTop Quick Fix Script
echo ================================================
echo.
echo This script will fix the Next.js structure and GPU issues.
echo.

:: Create scripts directory
if not exist "scripts" mkdir scripts

:: Create the setup script
echo Creating setup script...
(
echo const fs = require('fs'^);
echo const path = require('path'^);
echo.
echo const createPagesStructure = ^(^) =^> {
echo   const pagesDir = path.join^(process.cwd^(^), 'pages'^);
echo   const publicDir = path.join^(process.cwd^(^), 'public'^);
echo.  
echo   if ^(!fs.existsSync^(pagesDir^)^) {
echo     fs.mkdirSync^(pagesDir, { recursive: true }^);
echo     console.log^('✓ Created pages directory'^);
echo   }
echo.  
echo   if ^(!fs.existsSync^(publicDir^)^) {
echo     fs.mkdirSync^(publicDir, { recursive: true }^);
echo     console.log^('✓ Created public directory'^);
echo   }
echo.
echo   const appContent = `import React from 'react'^;
echo import type { AppProps } from 'next/app'^;
echo import '../src/renderer/styles/globals.css'^;
echo.
echo export default function MyApp^({ Component, pageProps }: AppProps^) {
echo   return ^<Component {...pageProps} /^>^;
echo }`^;
echo.  
echo   const appPath = path.join^(pagesDir, '_app.tsx'^);
echo   if ^(!fs.existsSync^(appPath^)^) {
echo     fs.writeFileSync^(appPath, appContent^);
echo     console.log^('✓ Created _app.tsx'^);
echo   }
echo.  
echo   const indexContent = `import React from 'react'^;
echo import App from '../src/renderer/App'^;
echo import ErrorBoundary from '../src/renderer/components/ErrorBoundary'^;
echo import { ThemeProvider } from '../src/renderer/contexts/ThemeContext'^;
echo.
echo export default function HomePage^(^) {
echo   return ^(
echo     ^<ErrorBoundary^>
echo       ^<ThemeProvider^>
echo         ^<App /^>
echo       ^</ThemeProvider^>
echo     ^</ErrorBoundary^>
echo   ^)^;
echo }`^;
echo.  
echo   const indexPath = path.join^(pagesDir, 'index.tsx'^);
echo   if ^(!fs.existsSync^(indexPath^)^) {
echo     fs.writeFileSync^(indexPath, indexContent^);
echo     console.log^('✓ Created index.tsx'^);
echo   }
echo.
echo   const documentContent = `import React from 'react'^;
echo import { Html, Head, Main, NextScript } from 'next/document'^;
echo.
echo export default function Document^(^) {
echo   return ^(
echo     ^<Html lang="en"^>
echo       ^<Head^>
echo         ^<meta charSet="UTF-8" /^>
echo         ^<meta name="description" content="Proxmox VE Desktop Manager" /^>
echo         ^<link rel="icon" href="/favicon.ico" /^>
echo       ^</Head^>
echo       ^<body^>
echo         ^<Main /^>
echo         ^<NextScript /^>
echo       ^</body^>
echo     ^</Html^>
echo   ^)^;
echo }`^;
echo.  
echo   const documentPath = path.join^(pagesDir, '_document.tsx'^);
echo   if ^(!fs.existsSync^(documentPath^)^) {
echo     fs.writeFileSync^(documentPath, documentContent^);
echo     console.log^('✓ Created _document.tsx'^);
echo   }
echo.
echo   const faviconPath = path.join^(publicDir, 'favicon.ico'^);
echo   if ^(!fs.existsSync^(faviconPath^)^) {
echo     fs.writeFileSync^(faviconPath, ''^);
echo     console.log^('✓ Created favicon.ico placeholder'^);
echo   }
echo.  
echo   console.log^('✓ Next.js pages structure ready'^);
echo }^;
echo.
echo try {
echo   createPagesStructure^(^)^;
echo } catch ^(error^) {
echo   console.error^('Error setting up pages structure:', error^);
echo   process.exit^(1^);
echo }
) > scripts\setup-pages.js

echo ✓ Created setup script

:: Run the setup
echo.
echo Running setup...
node scripts\setup-pages.js

echo.
echo ================================================
echo Setup complete! Now you can run:
echo.
echo   npm run start:safe    (Recommended for GPU issues)
echo   npm run start         (Standard mode)
echo   npm run start:minimal (Ultra-safe mode)
echo.
echo ================================================
pause