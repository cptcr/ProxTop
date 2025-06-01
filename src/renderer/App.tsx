// src/renderer/App.tsx - Improved with better connection handling
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Monitor, 
  HardDrive, 
  Network, 
  Archive, 
  Settings,
  Database,
  Layers,
  Users,
  Disc,
  Moon,
  Sun,
  Server,
  Menu,
  X,
  Home,
  BarChart3,
  Shield,
  Cloud,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useProxmox } from './hooks/useProxmox';
import ConnectionManager from './components/ConnectionManager';
import Dashboard from './components/Dashboard';
import NodeManager from './components/NodeManager';
import VMManager from './components/VMManager';
import ContainerManager from './components/ContainerManager';
import StorageManager from './components/StorageManager';
import NetworkManager from './components/NetworkManager';
import BackupManager from './components/BackupManager';
import SettingsComponent from './components/Settings';
import UserManager from './components/UserManager';
import ISOManager from './components/ISOManager';

type TabType = 'connection' | 'dashboard' | 'nodes' | 'vms' | 'containers' | 'storage' | 'network' | 'backups' | 'settings' | 'users' | 'iso';

interface NavigationItem {
  id: TabType;
  label: string;
  icon: React.FC<{ className?: string }>;
  requiresConnection?: boolean;
  description?: string;
  color?: string;
}

interface NavigationSection {
  name: string;
  items: NavigationItem[];
}

interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  realm: string;
  ignoreSSL: boolean;
}

const AppContent: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('connection');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ConnectionConfig | null>(null);

  const {
    nodes,
    clusterResources,
    loading,
    error,
    fetchNodes,
    fetchClusterResources,
  } = useProxmox();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Simple error management
  const addError = (error: string) => {
    setErrors(prev => [error, ...prev.slice(0, 4)]); // Keep last 5 errors
  };
  
  const clearErrors = () => {
    setErrors([]);
  };

  // Handle initial connection check
  useEffect(() => {
    const savedConfig = localStorage.getItem('proxmox-connection-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setCurrentConfig(config);
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, []);

  // Update active tab based on connection state
  useEffect(() => {
    if (isConnected && activeTab === 'connection') {
      setActiveTab('dashboard');
    } else if (!isConnected && activeTab !== 'connection' && activeTab !== 'settings') {
      setActiveTab('connection');
    }
  }, [isConnected, activeTab]);

  // Handle connection change from ConnectionManager
  const handleConnectionChange = async (connected: boolean, config?: ConnectionConfig) => {
    setIsConnected(connected);
    if (connected && config) {
      setCurrentConfig(config);
      setConnectionError(null);
      // Fetch initial data
      try {
        await Promise.all([fetchNodes(), fetchClusterResources()]);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        addError('Failed to fetch initial data');
      }
    } else {
      setCurrentConfig(null);
      setConnectionError(null);
    }
  };

  // Simple connect function for ConnectionManager
  const connect = async (config: ConnectionConfig) => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await window.electronAPI.connect(config);
      
      if (result.success) {
        setIsConnected(true);
        setCurrentConfig(config);
        return { success: true };
      } else {
        setConnectionError(result.error || 'Connection failed');
        addError(result.error || 'Connection failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setConnectionError(errorMessage);
      addError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsConnecting(false);
    }
  };

  // Simple disconnect function
  const disconnect = async () => {
    try {
      await window.electronAPI.disconnect();
    } catch (error) {
      console.error('Error during disconnect:', error);
    } finally {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError(null);
      setCurrentConfig(null);
    }
  };

  const navigationSections: NavigationSection[] = [
    {
      name: 'Connection',
      items: [
        { 
          id: 'connection', 
          label: 'Connection', 
          icon: isConnected ? Wifi : WifiOff, 
          description: isConnected ? 'Connected' : 'Not connected',
          color: isConnected ? 'text-green-600' : 'text-red-600'
        }
      ]
    },
    {
      name: 'Overview',
      items: [
        { 
          id: 'dashboard', 
          label: 'Dashboard', 
          icon: BarChart3, 
          requiresConnection: true, 
          description: 'Cluster overview'
        }
      ]
    },
    {
      name: 'Infrastructure',
      items: [
        { 
          id: 'nodes', 
          label: 'Nodes', 
          icon: Server, 
          requiresConnection: true, 
          description: 'Node management'
        },
        { 
          id: 'storage', 
          label: 'Storage', 
          icon: HardDrive, 
          requiresConnection: true, 
          description: 'Storage pools'
        },
        { 
          id: 'network', 
          label: 'Network', 
          icon: Network, 
          requiresConnection: true, 
          description: 'Network configuration'
        }
      ]
    },
    {
      name: 'Compute',
      items: [
        { 
          id: 'vms', 
          label: 'Virtual Machines', 
          icon: Monitor, 
          requiresConnection: true, 
          description: 'VM management'
        },
        { 
          id: 'containers', 
          label: 'Containers', 
          icon: Database, 
          requiresConnection: true, 
          description: 'LXC containers'
        }
      ]
    },
    {
      name: 'Data & Security',
      items: [
        { 
          id: 'backups', 
          label: 'Backups', 
          icon: Archive, 
          requiresConnection: true, 
          description: 'Backup management'
        },
        { 
          id: 'iso', 
          label: 'ISO Images', 
          icon: Disc, 
          requiresConnection: true, 
          description: 'ISO management'
        },
        { 
          id: 'users', 
          label: 'Users', 
          icon: Users, 
          requiresConnection: true, 
          description: 'User management'
        }
      ]
    },
    {
      name: 'System',
      items: [
        { 
          id: 'settings', 
          label: 'Settings', 
          icon: Settings, 
          description: 'Application settings'
        }
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'connection':
        return <ConnectionManager onConnectionChange={handleConnectionChange} />;
      case 'dashboard':
        return <Dashboard />;
      case 'nodes':
        return <NodeManager />;
      case 'vms':
        return <VMManager />;
      case 'containers':
        return <ContainerManager />;
      case 'storage':
        return <StorageManager />;
      case 'network':
        return <NetworkManager />;
      case 'backups':
        return <BackupManager />;
      case 'iso':
        return <ISOManager />;
      case 'users':
        return <UserManager />;
      case 'settings':
        return <SettingsComponent connection={{ connected: isConnected, config: currentConfig }} setConnection={() => {}} />;
      default:
        return <ConnectionManager onConnectionChange={handleConnectionChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-white border-r border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    ProxTop
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Proxmox Manager
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {!sidebarCollapsed && (
                <button
                  onClick={toggleDarkMode}
                  className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
              
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
              >
                {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {isConnected && currentConfig ? (
            <div className="p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate dark:text-green-400">
                      Connected
                    </p>
                    <p className="text-xs text-green-600 truncate dark:text-green-500">
                      {currentConfig.host}:{currentConfig.port}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : isConnecting ? (
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                {!sidebarCollapsed && (
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                    Connecting...
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-900/20 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                {!sidebarCollapsed && (
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Not Connected
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {errors.length > 0 && !sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      {errors[0]}
                    </p>
                    {errors.length > 1 && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        +{errors.length - 1} more errors
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={clearErrors}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navigationSections.map((section) => (
            <div key={section.name}>
              {!sidebarCollapsed && (
                <h3 className="px-2 mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  {section.name}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isDisabled = item.requiresConnection && !isConnected;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => !isDisabled && setActiveTab(item.id as TabType)}
                      disabled={isDisabled}
                      className={`group relative w-full flex items-center rounded-lg transition-colors duration-200 ${
                        sidebarCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
                      } ${
                        isDisabled 
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                      } ${
                        isActive 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={`flex-shrink-0 w-5 h-5 ${item.color || ''}`} />
                      {!sidebarCollapsed && (
                        <div className="ml-3 text-left">
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.description}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Tooltip for collapsed sidebar */}
                      {sidebarCollapsed && (
                        <div className="absolute z-50 px-2 py-1 ml-2 text-xs font-medium text-white transition-opacity duration-200 bg-gray-900 rounded shadow-lg opacity-0 pointer-events-none left-full group-hover:opacity-100 whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ProxTop v1.0.0
              </p>
              {currentConfig && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {currentConfig.username}@{currentConfig.realm}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;