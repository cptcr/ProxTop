import React from 'react';
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
}
