const fs = require('fs');
const path = require('path');

const createPagesStructure = () => {
  const pagesDir = path.join(process.cwd(), 'pages');
  const publicDir = path.join(process.cwd(), 'public');
  
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
    console.log('✓ Created pages directory');
  }
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✓ Created public directory');
  }

  const appContent = `import React from 'react';
import type { AppProps } from 'next/app';
import '../src/renderer/styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}`;
  
  const appPath = path.join(pagesDir, '_app.tsx');
  if (!fs.existsSync(appPath)) {
    fs.writeFileSync(appPath, appContent);
    console.log('✓ Created _app.tsx');
  }
  
  const indexContent = `import React from 'react';
import App from '../src/renderer/App';
import ErrorBoundary from '../src/renderer/components/ErrorBoundary';
import { ThemeProvider } from '../src/renderer/contexts/ThemeContext';

export default function HomePage() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}`;
  
  const indexPath = path.join(pagesDir, 'index.tsx');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, indexContent);
    console.log('✓ Created index.tsx');
  }

  const documentContent = `import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="description" content="Proxmox VE Desktop Manager" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}`;
  
  const documentPath = path.join(pagesDir, '_document.tsx');
  if (!fs.existsSync(documentPath)) {
    fs.writeFileSync(documentPath, documentContent);
    console.log('✓ Created _document.tsx');
  }

  const faviconPath = path.join(publicDir, 'favicon.ico');
  if (!fs.existsSync(faviconPath)) {
    fs.writeFileSync(faviconPath, '');
    console.log('✓ Created favicon.ico placeholder');
  }
  
  console.log('✓ Next.js pages structure ready');
};

try {
  createPagesStructure();
} catch (error) {
  console.error('Error setting up pages structure:', error);
  process.exit(1);
}
