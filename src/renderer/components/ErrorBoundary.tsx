// src/renderer/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex items-center mb-4">
                <div className="p-2 mr-3 bg-red-100 rounded-lg dark:bg-red-900">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    An unexpected error occurred in the application
                  </p>
                </div>
              </div>

              {/* Error Details */}
              {this.state.error && (
                <div className="p-4 mb-6 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Error Details:
                  </h3>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="text-sm text-gray-600 cursor-pointer dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                        Stack Trace (Development)
                      </summary>
                      <pre className="mt-2 overflow-auto text-xs text-gray-600 dark:text-gray-400 max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center space-x-2 btn-secondary"
                >
                  <Home className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center space-x-2 btn-primary"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload App</span>
                </button>
              </div>

              {/* Help Text */}
              <div className="p-4 mt-6 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <h4 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-300">
                  What can you do?
                </h4>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
                  <li>• Try clicking "Try Again" to reset the component</li>
                  <li>• Reload the application to start fresh</li>
                  <li>• Check your connection to Proxmox</li>
                  <li>• If the problem persists, restart the application</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;