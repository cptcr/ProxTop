// src/renderer/components/Settings.tsx - KORRIGIERTE TYPEN
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, TestTube, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  realm: string;
  ignoreSSL: boolean;
}

interface ConnectionState {
  connected: boolean;
  config: ConnectionConfig | null;
}

interface SettingsProps {
  connection: ConnectionState;
  setConnection: (newState: ConnectionState) => void;
}

const Settings: React.FC<SettingsProps> = ({ connection, setConnection }) => {
  const [config, setConfig] = useState<ConnectionConfig>({
    host: '',
    port: 8006,
    username: 'root',
    password: '',
    realm: 'pam',
    ignoreSSL: true,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load saved configuration from connection state or localStorage
    if (connection.config) {
      setConfig(connection.config);
    } else {
      const savedConfig = localStorage.getItem('proxmox-config');
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (error) {
          console.error('Failed to parse saved config:', error);
        }
      }
    }
  }, [connection.config]);

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
    setSaving(true);
    try {
      const result = await window.electronAPI.connect(config);
      if (result.success) {
        // Save configuration
        localStorage.setItem('proxmox-config', JSON.stringify(config));
        
        // Update connection state
        setConnection({
          connected: true,
          config: config,
        });
        
        setTestResult({ success: true, message: 'Connected successfully!' });
      } else {
        setTestResult({ success: false, message: result.error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    try {
      await window.electronAPI.disconnect();
      setConnection({
        connected: false,
        config: null,
      });
      setTestResult(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <SettingsIcon className="w-8 h-8 mr-3 text-gray-600 dark:text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
        </div>

        <div className="card">
          <h3 className="mb-6 text-lg font-medium text-gray-900 dark:text-white">Proxmox VE Connection</h3>
          
          {connection.connected && (
            <div className="p-4 mb-6 border border-green-200 rounded-md bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-300">
                    Connected to {connection.config?.host}:{connection.config?.port}
                  </span>
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

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Host/IP Address
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  className="input-field"
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Port
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                  className="input-field"
                  min="1"
                  max="65535"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="input-field"
                  placeholder="root"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Realm
                </label>
                <select
                  value={config.realm}
                  onChange={(e) => handleInputChange('realm', e.target.value)}
                  className="select-field"
                >
                  <option value="pam">Linux PAM</option>
                  <option value="pve">Proxmox VE</option>
                  <option value="ad">Active Directory</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pr-10 input-field"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="ignoreSSL"
                checked={config.ignoreSSL}
                onChange={(e) => handleInputChange('ignoreSSL', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="ignoreSSL" className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                Ignore SSL certificate errors
              </label>
            </div>

            {testResult && (
              <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                <div className="flex items-center">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                  )}
                  <span className={testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={testConnection}
                disabled={testing || !config.host || !config.username || !config.password}
                className="flex items-center space-x-2 btn-secondary"
              >
                {testing ? (
                  <div className="w-4 h-4 border-b-2 border-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                <span>Test Connection</span>
              </button>
              
              <button
                onClick={saveAndConnect}
                disabled={saving || !config.host || !config.username || !config.password || connection.connected}
                className="flex items-center space-x-2 btn-primary"
              >
                {saving ? (
                  <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </div>

        {/* Application Settings */}
        <div className="mt-6 card">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Application Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-refresh interval</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">How often to refresh data automatically</p>
              </div>
              <select className="select-field">
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
                <option value="0">Disabled</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Show notifications</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Display system notifications for events</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark mode</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use dark color scheme</p>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;