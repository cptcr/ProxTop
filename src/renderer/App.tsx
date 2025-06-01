// src/renderer/App.tsx
import React, { useState, useEffect } from 'react';
import { 
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
  Activity,
  Server,
  Zap,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import NodeManager from './components/NodeManager';
import VMManager from './components/VMManager';
import ContainerManager from './components/ContainerManager';
import StorageManager from './components/StorageManager';
import NetworkManager from './components/NetworkManager';
import BackupManager from './components/BackupManager';
import SettingsComponent from './components/Settings';
import InstanceManager from './components/InstanceManager';
import UserManager from './components/UserManager';
import ISOManager from './components/ISOManager';
import VMHardwareManager from './components/VMHardwareManager';
import NoVNCConsole from './components/NoVNCConsole';

type TabType = 'dashboard' | 'nodes' | 'vms' | 'containers' | 'storage' | 'network' | 'backups' | 'instances' | 'settings' | 'users' | 'iso';

interface ProxmoxInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  realm: string;
  ignoreSSL: boolean;
  connected: boolean;
  lastConnected?: Date;
}

interface VMConsoleState {
  vmId: number;
  nodeId: string;
  vmName: string;
}

interface VMHardwareState {
  vmId: number;
  nodeId: string;
}

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

const AppContent: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('instances');
  const [currentInstance, setCurrentInstance] = useState<ProxmoxInstance | null>(null);
  const [showVMHardware, setShowVMHardware] = useState<VMHardwareState | null>(null);
  const [showVMConsole, setShowVMConsole] = useState<VMConsoleState | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    config: null
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Load last connected instance on startup
    const savedInstances = localStorage.getItem('proxmox-instances');
    if (savedInstances) {
      try {
        const instances = JSON.parse(savedInstances);
        const connectedInstance = instances.find((inst: ProxmoxInstance) => inst.connected);
        if (connectedInstance) {
          setCurrentInstance(connectedInstance);
          setConnectionState({
            connected: true,
            config: {
              host: connectedInstance.host,
              port: connectedInstance.port,
              username: connectedInstance.username,
              password: connectedInstance.password,
              realm: connectedInstance.realm,
              ignoreSSL: connectedInstance.ignoreSSL
            }
          });
          setActiveTab('dashboard');
        }
      } catch (error) {
        console.error('Failed to load instances:', error);
      }
    }

    const removeListener = window.electronAPI.onMenuConnect(() => {
      setActiveTab('instances');
    });

    return () => {
      if (removeListener && typeof removeListener === 'function') {
        removeListener();
      }
    };
  }, []);

  useEffect(() => {
    if (currentInstance && currentInstance.connected) {
      setConnectionState({
        connected: true,
        config: {
          host: currentInstance.host,
          port: currentInstance.port,
          username: currentInstance.username,
          password: currentInstance.password,
          realm: currentInstance.realm,
          ignoreSSL: currentInstance.ignoreSSL
        }
      });
    } else {
      setConnectionState({
        connected: false,
        config: null
      });
    }
  }, [currentInstance]);

  const tabs = [
    { 
      id: 'instances', 
      label: 'Instances', 
      icon: Layers, 
      category: 'Management'
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Activity, 
      requiresConnection: true, 
      category: 'Overview'
    },
    { 
      id: 'nodes', 
      label: 'Nodes', 
      icon: Server, 
      requiresConnection: true, 
      category: 'Infrastructure'
    },
    { 
      id: 'vms', 
      label: 'Virtual Machines', 
      icon: Monitor, 
      requiresConnection: true, 
      category: 'Compute'
    },
    { 
      id: 'containers', 
      label: 'Containers', 
      icon: Database, 
      requiresConnection: true, 
      category: 'Compute'
    },
    { 
      id: 'storage', 
      label: 'Storage', 
      icon: HardDrive, 
      requiresConnection: true, 
      category: 'Infrastructure'
    },
    { 
      id: 'network', 
      label: 'Network', 
      icon: Network, 
      requiresConnection: true, 
      category: 'Infrastructure'
    },
    { 
      id: 'backups', 
      label: 'Backups', 
      icon: Archive, 
      requiresConnection: true, 
      category: 'Data'
    },
    { 
      id: 'iso', 
      label: 'ISO Images', 
      icon: Disc, 
      requiresConnection: true, 
      category: 'Data'
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: Users, 
      requiresConnection: true, 
      category: 'Security'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      category: 'Management'
    },
  ];

  const openVMHardware = (vmId: number, nodeId: string) => {
    setShowVMHardware({ vmId, nodeId });
  };

  const openVMConsole = (vmId: number, nodeId: string, vmName: string) => {
    setShowVMConsole({ vmId, nodeId, vmName });
  };

  const renderContent = () => {
    if (activeTab !== 'instances' && activeTab !== 'settings' && !currentInstance?.connected) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
          <div className="text-center">
            <div className="max-w-md p-8 mx-auto bg-white border border-gray-200 shadow-xl rounded-2xl dark:bg-gray-900 dark:border-gray-800">
              <div className="mb-6">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <Layers className="w-10 h-10 text-white" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  No Active Connection
                </h2>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  Connect to a Proxmox instance to access cluster management features
                </p>
              </div>
              <button
                onClick={() => setActiveTab('instances')}
                className="w-full btn-primary"
              >
                <Layers className="w-4 h-4 mr-2" />
                Manage Instances
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'instances':
        return (
          <InstanceManager 
            currentInstance={currentInstance} 
            setCurrentInstance={setCurrentInstance} 
          />
        );
      case 'dashboard':
        return <Dashboard />;
      case 'nodes':
        return <NodeManager />;
      case 'vms':
        return (
          <VMManager 
            onOpenHardware={openVMHardware}
            onOpenConsole={openVMConsole}
          />
        );
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
        return (
          <SettingsComponent 
            connection={connectionState}
            setConnection={setConnectionState}
          />
        );
      default:
        return <InstanceManager currentInstance={currentInstance} setCurrentInstance={setCurrentInstance} />;
    }
  };

  // Group tabs by category
  const tabsByCategory = tabs.reduce((acc, tab) => {
    const category = tab.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tab);
    return acc;
  }, {} as Record<string, typeof tabs>);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Modern Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl dark:bg-gray-900/80 dark:border-gray-800/50 flex flex-col`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold gradient-text">
                    ProxTop
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Modern Management
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {!sidebarCollapsed && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-500 transition-all duration-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 hover:scale-110"
                  title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
              )}
              
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-gray-500 transition-all duration-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 hover:scale-110"
              >
                {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          {!sidebarCollapsed && (
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-sm placeholder-gray-400 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Connection Status */}
        {currentInstance?.connected && !sidebarCollapsed && (
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="p-4 border border-green-200 rounded-xl bg-green-50/50 backdrop-blur-sm dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <div className="flex">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 -ml-1 delay-75 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 -ml-1 delay-150 bg-green-300 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800 truncate dark:text-green-400">
                    {currentInstance.name}
                  </p>
                  <p className="text-xs text-green-600 truncate dark:text-green-500">
                    {currentInstance.host}:{currentInstance.port}
                  </p>
                </div>
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
          {Object.entries(tabsByCategory).map(([category, categoryTabs]) => (
            <div key={category}>
              {!sidebarCollapsed && (
                <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  {category}
                </h3>
              )}
              <div className="space-y-1">
                {categoryTabs
                  .filter(tab => !searchQuery || tab.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((tab) => {
                    const Icon = tab.icon;
                    const isDisabled = tab.requiresConnection && !currentInstance?.connected;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => !isDisabled && setActiveTab(tab.id as TabType)}
                        disabled={isDisabled}
                        className={`group relative w-full flex items-center rounded-xl transition-all duration-200 ${
                          sidebarCollapsed ? 'p-3 justify-center' : 'px-4 py-3'
                        } ${
                          isDisabled 
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:scale-105 cursor-pointer'
                        } ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-400 shadow-lg border border-blue-200 dark:border-blue-800' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                        title={sidebarCollapsed ? tab.label : undefined}
                      >
                        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} w-full`}>
                          <div className={`p-2 rounded-lg transition-all duration-200 ${
                            isActive 
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg' 
                              : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                          }`}>
                            <Icon className="flex-shrink-0 w-5 h-5" />
                          </div>
                          {!sidebarCollapsed && (
                            <div className="flex-1 text-left">
                              <span className="font-medium">{tab.label}</span>
                              {isActive && (
                                <div className="text-xs text-blue-600 opacity-75 dark:text-blue-400">
                                  Active
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {isActive && (
                          <div className="absolute right-0 w-1 h-8 rounded-l-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
                        )}
                        
                        {/* Tooltip for collapsed sidebar */}
                        {sidebarCollapsed && (
                          <div className="absolute z-50 px-3 py-2 ml-3 text-sm font-medium text-white transition-opacity duration-200 bg-gray-900 rounded-lg opacity-0 pointer-events-none left-full group-hover:opacity-100 whitespace-nowrap">
                            {tab.label}
                            <div className="absolute left-0 w-2 h-2 transform rotate-45 -translate-x-1 -translate-y-1/2 bg-gray-900 top-1/2"></div>
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
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-800/50">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ProxTop v1.0.0
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Modern Proxmox Management
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
      {showVMHardware && (
        <VMHardwareManager
          vmId={showVMHardware.vmId}
          nodeId={showVMHardware.nodeId}
          onClose={() => setShowVMHardware(null)}
        />
      )}

      {showVMConsole && (
        <NoVNCConsole
          vmId={showVMConsole.vmId}
          nodeId={showVMConsole.nodeId}
          vmName={showVMConsole.vmName}
          onClose={() => setShowVMConsole(null)}
        />
      )}

      {/* Notification Center */}
      {notifications.length > 0 && (
        <div className="fixed z-50 space-y-2 top-4 right-4">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl shadow-lg border transition-all duration-300 transform ${
                notification.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : notification.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
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