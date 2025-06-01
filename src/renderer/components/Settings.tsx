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

interface SettingsProps {
  connection: {
    connected: boolean;
    config: ConnectionConfig | null;
  };
  setConnection: React.Dispatch<React.SetStateAction<{
    connected: boolean;
    config: ConnectionConfig | null;
  }>>;
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
    // Load saved configuration from localStorage or connection state
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
    setTestResult(null); // Clear test result when config changes
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await window.electronAPI.connect(config);
      if (result.success) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: result.error || 'Connection failed' });
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
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <SettingsIcon className="h-8 w-8 text-gray-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Proxmox VE Connection</h3>
          
          {connection.connected && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Connected to {connection.config?.host}:{connection.config?.port}
                </span>
              </div>
              <button
                onClick={disconnect}
                className="mt-2 btn-danger"
              >
                Disconnect
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host/IP Address
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="65535"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="root"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Realm
                </label>
                <select
                  value={config.realm}
                  onChange={(e) => handleInputChange('realm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pam">Linux PAM</option>
                  <option value="pve">Proxmox VE</option>
                  <option value="ad">Active Directory</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="ignoreSSL" className="ml-2 block text-sm text-gray-700">
                Ignore SSL certificate errors
              </label>
            </div>

            {testResult && (
              <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={testConnection}
                disabled={testing || !config.host || !config.username || !config.password}
                className="btn-secondary flex items-center space-x-2"
              >
                {testing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                <span>Test Connection</span>
              </button>
              
              <button
                onClick={saveAndConnect}
                disabled={saving || !config.host || !config.username || !config.password || connection.connected}
                className="btn-primary flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </div>

        {/* Application Settings */}
        <div className="card mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Application Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Auto-refresh interval</h4>
                <p className="text-sm text-gray-500">How often to refresh data automatically</p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
                <option value="0">Disabled</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Show notifications</h4>
                <p className="text-sm text-gray-500">Display system notifications for events</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Dark mode</h4>
                <p className="text-sm text-gray-500">Use dark color scheme</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;