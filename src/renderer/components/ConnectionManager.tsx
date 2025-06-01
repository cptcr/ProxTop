// src/renderer/components/ConnectionManager.tsx - Fixed connection component
import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  Eye, 
  EyeOff, 
  TestTube, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  Activity 
} from 'lucide-react';

interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  realm: string;
  ignoreSSL: boolean;
}

interface ConnectionManagerProps {
  onConnectionChange: (connected: boolean, config?: ConnectionConfig) => void;
}

const ConnectionManager: React.FC<ConnectionManagerProps> = ({ onConnectionChange }) => {
  const [config, setConfig] = useState<ConnectionConfig>({
    host: '',
    port: 8006,
    username: 'root',
    password: '',
    realm: 'pam',
    ignoreSSL: true,
  });
  
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('proxmox-connection-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, []);

  const handleInputChange = (field: keyof ConnectionConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await window.electronAPI.connect(config);
      if (result.success) {
        setTestResult({ success: true, message: 'Connection test successful!' });
      } else {
        setTestResult({ success: false, message: result.error || 'Connection test failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: (error as Error).message });
    } finally {
      setTesting(false);
    }
  };

  const saveAndConnect = async () => {
    setConnecting(true);
    setTestResult(null);

    try {
      const result = await window.electronAPI.connect(config);
      if (result.success) {
        // Save configuration
        localStorage.setItem('proxmox-connection-config', JSON.stringify(config));
        
        // Update connection state
        setIsConnected(true);
        onConnectionChange(true, config);
        
        setTestResult({ success: true, message: 'Connected successfully!' });
      } else {
        setTestResult({ success: false, message: result.error || 'Connection failed' });
        setIsConnected(false);
        onConnectionChange(false);
      }
    } catch (error) {
      setTestResult({ success: false, message: (error as Error).message });
      setIsConnected(false);
      onConnectionChange(false);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await window.electronAPI.disconnect();
      setIsConnected(false);
      onConnectionChange(false);
      setTestResult(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ProxTop
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Proxmox VE Desktop Manager
          </p>
        </div>

        {/* Connection Status */}
        {isConnected && (
          <div className="p-4 mb-6 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Connected to {config.host}:{config.port}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {config.username}@{config.realm}
                  </p>
                </div>
              </div>
              <button
                onClick={disconnect}
                className="btn-danger"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Connection Form */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Server className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isConnected ? 'Connection Settings' : 'Connect to Proxmox VE'}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Host and Port */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Host/IP Address
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  className="input-field"
                  placeholder="192.168.1.100 or proxmox.example.com"
                  disabled={isConnected}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Port
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 8006)}
                  className="input-field"
                  min="1"
                  max="65535"
                  disabled={isConnected}
                />
              </div>
            </div>

            {/* Username and Realm */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="input-field"
                  placeholder="root"
                  disabled={isConnected}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Realm
                </label>
                <select
                  value={config.realm}
                  onChange={(e) => handleInputChange('realm', e.target.value)}
                  className="select-field"
                  disabled={isConnected}
                >
                  <option value="pam">Linux PAM</option>
                  <option value="pve">Proxmox VE</option>
                  <option value="ad">Active Directory</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pr-10 input-field"
                  placeholder="Enter password"
                  disabled={isConnected}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  disabled={isConnected}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* SSL Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ignoreSSL"
                checked={config.ignoreSSL}
                onChange={(e) => handleInputChange('ignoreSSL', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isConnected}
              />
              <label htmlFor="ignoreSSL" className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                Ignore SSL certificate errors (recommended for self-signed certificates)
              </label>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                  : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
              }`}>
                <div className="flex items-center">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                  )}
                  <span className={
                    testResult.success 
                      ? 'text-green-800 dark:text-green-300' 
                      : 'text-red-800 dark:text-red-300'
                  }>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isConnected && (
              <div className="flex space-x-3">
                <button
                  onClick={testConnection}
                  disabled={testing || !config.host || !config.username || !config.password}
                  className="flex items-center space-x-2 btn-secondary"
                >
                  {testing ? (
                    <div className="w-4 h-4 border-2 border-gray-600 rounded-full border-t-transparent animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  <span>Test Connection</span>
                </button>
                
                <button
                  onClick={saveAndConnect}
                  disabled={connecting || !config.host || !config.username || !config.password}
                  className="flex items-center flex-1 space-x-2 btn-primary"
                >
                  {connecting ? (
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Connect</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Help Information */}
        <div className="mt-8 card">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Connection Help
          </h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start space-x-2">
              <span className="font-medium text-blue-600 dark:text-blue-400">•</span>
              <p>Enter your Proxmox VE server's IP address or hostname</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-blue-600 dark:text-blue-400">•</span>
              <p>Default port is 8006 (HTTPS web interface)</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-blue-600 dark:text-blue-400">•</span>
              <p>Use your Proxmox VE username and password</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-blue-600 dark:text-blue-400">•</span>
              <p>Enable "Ignore SSL errors" for self-signed certificates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionManager;