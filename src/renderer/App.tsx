// src/renderer/App.tsx - Complete redesign for clean, minimalistic UI
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
  Zap,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Home,
  BarChart3,
  Shield,
  Cloud
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
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

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

  const navigationSections = [
    {
      name: 'Overview',
      items: [
        { 
          id: 'instances', 
          label: 'Instances', 
          icon: Layers, 
          description: 'Manage Proxmox connections'
        },
        { 
          id: 'dashboard', 
          label: 'Dashboard', 
          icon: BarChart3, 
          requiresConnection: true, 
          description: 'Real-time cluster overview'
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
          description: 'Physical server management'
        },
        { 
          id: 'storage', 
          label: 'Storage', 
          icon: HardDrive, 
          requiresConnection: true, 
          description: 'Storage pools and volumes'
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
          description: 'VM management and control'
        },
        { 
          id: 'containers', 
          label: 'Containers', 
          icon: Database, 
          requiresConnection: true, 
          description: 'LXC container management'
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
          description: 'Backup jobs and restoration'
        },
        { 
          id: 'iso', 
          label: 'ISO Images', 
          icon: Disc, 
          requiresConnection: true, 
          description: 'ISO file management'
        },
        { 
          id: 'users', 
          label: 'Users', 
          icon: Users, 
          requiresConnection: true, 
          description: 'User and permission management'
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
          description: 'Application preferences'
        }
      ]
    }
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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
          <div className="text-center">
            <div className="max-w-lg p-12 mx-auto border shadow-2xl bg-white/80 backdrop-blur-xl border-gray-200/50 rounded-3xl dark:bg-gray-900/80 dark:border-gray-800/50">
              <div className="mb-8">
                <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 shadow-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl">
                  <Cloud className="w-12 h-12 text-white" />
                </div>
                <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                  No Active Connection
                </h2>
                <p className="mb-8 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                  Connect to a Proxmox instance to access powerful cluster management features and real-time monitoring.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('instances')}
                className="w-full px-8 py-4 text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl active:scale-95"
              >
                <Layers className="inline w-5 h-5 mr-3" />
                Connect to Proxmox
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Ultra-Modern Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} transition-all duration-500 ease-in-out bg-white/90 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl dark:bg-gray-900/90 dark:border-gray-800/50 flex flex-col relative overflow-hidden`}>
        {/* Sidebar Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl">
                  <Zap className="text-white w-7 h-7" />
                </div>
                <div className="absolute w-4 h-4 bg-green-400 border-2 border-white rounded-full -bottom-1 -right-1 dark:border-gray-900 animate-pulse"></div>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text">
                    ProxTop
                  </h1>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Modern Infrastructure
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {!sidebarCollapsed && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2.5 text-gray-500 transition-all duration-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 hover:scale-110 active:scale-95"
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
                className="p-2.5 text-gray-500 transition-all duration-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 hover:scale-110 active:scale-95"
              >
                {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          {!sidebarCollapsed && (
            <div className="relative mt-6">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
              <input
                type="text"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-12 pr-4 text-sm placeholder-gray-400 transition-all duration-300 border-0 bg-gray-100/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-gray-800/80 dark:text-white dark:focus:bg-gray-800"
              />
            </div>
          )}
        </div>

        {/* Connection Status */}
        {currentInstance?.connected && !sidebarCollapsed && (
          <div className="relative z-10 p-6 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="p-4 border border-green-200/50 rounded-2xl bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800/50">
              <div className="flex items-center space-x-3">
                <div className="relative flex">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 -ml-2 delay-75 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 -ml-2 delay-150 bg-green-300 rounded-full animate-pulse"></div>
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
        <nav className="relative z-10 flex-1 p-6 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600">
          {navigationSections.map((section) => (
            <div key={section.name}>
              {!sidebarCollapsed && (
                <h3 className="px-2 mb-4 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  {section.name}
                </h3>
              )}
              <div className="space-y-2">
                {section.items
                  .filter(item => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item) => {
                    const Icon = item.icon;
                    const isDisabled = item.requiresConnection && !currentInstance?.connected;
                    const isActive = activeTab === item.id;
                    const isHovered = hoveredTab === item.id;
                    
                    return (
                      <div key={item.id} className="relative">
                        <button
                          onClick={() => !isDisabled && setActiveTab(item.id as TabType)}
                          disabled={isDisabled}
                          onMouseEnter={() => setHoveredTab(item.id)}
                          onMouseLeave={() => setHoveredTab(null)}
                          className={`group relative w-full flex items-center rounded-2xl transition-all duration-300 ${
                            sidebarCollapsed ? 'p-3 justify-center' : 'px-4 py-3'
                          } ${
                            isDisabled 
                              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50' 
                              : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:scale-105 cursor-pointer hover:shadow-lg'
                          } ${
                            isActive 
                              ? 'bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-400 shadow-lg border border-blue-200/50 dark:border-blue-800/50 scale-105' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-4'} w-full`}>
                            <div className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                              isActive 
                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110' 
                                : isHovered
                                ? 'bg-gray-200 dark:bg-gray-700 scale-110'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              <Icon className="flex-shrink-0 w-5 h-5" />
                              {isActive && (
                                <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                              )}
                            </div>
                            {!sidebarCollapsed && (
                              <div className="flex-1 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold">{item.label}</span>
                                  {isActive && (
                                    <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                                {isActive && (
                                  <div className="mt-1 text-xs font-medium text-blue-600 opacity-75 dark:text-blue-400">
                                    Active
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {isActive && (
                            <div className="absolute right-0 w-1 h-12 rounded-l-full shadow-lg bg-gradient-to-b from-blue-500 to-purple-600"></div>
                          )}
                          
                          {/* Enhanced Tooltip for collapsed sidebar */}
                          {sidebarCollapsed && (
                            <div className={`absolute z-50 px-4 py-3 ml-4 text-sm font-medium text-white transition-all duration-300 bg-gray-900/95 backdrop-blur-sm rounded-xl left-full shadow-2xl border border-gray-700/50 ${
                              isHovered ? 'opacity-100 translate-x-2' : 'opacity-0 translate-x-0 pointer-events-none'
                            } whitespace-nowrap`}>
                              <div className="font-semibold">{item.label}</div>
                              {item.description && (
                                <div className="mt-1 text-xs text-gray-300">{item.description}</div>
                              )}
                              <div className="absolute left-0 w-3 h-3 transform rotate-45 -translate-x-1.5 -translate-y-1/2 bg-gray-900 top-1/2 border-l border-t border-gray-700/50"></div>
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="relative z-10 p-6 border-t border-gray-200/50 dark:border-gray-800/50">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2 space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  ProxTop v1.0.0
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Next-Generation Proxmox Management
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Content Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/50 to-blue-50/50 dark:from-gray-950/50 dark:via-gray-900/50 dark:to-blue-950/50"></div>
        
        {/* Content */}
        <div className="relative z-10 h-full">
          {renderContent()}
        </div>
      </div>

      {/* Enhanced Modals */}
      {showVMHardware && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-6xl transition-all duration-300 transform scale-100">
            <VMHardwareManager
              vmId={showVMHardware.vmId}
              nodeId={showVMHardware.nodeId}
              onClose={() => setShowVMHardware(null)}
            />
          </div>
        </div>
      )}

      {showVMConsole && (
        <div className="fixed inset-0 z-50">
          <NoVNCConsole
            vmId={showVMConsole.vmId}
            nodeId={showVMConsole.nodeId}
            vmName={showVMConsole.vmName}
            onClose={() => setShowVMConsole(null)}
          />
        </div>
      )}

      {/* Enhanced Notification Center */}
      {notifications.length > 0 && (
        <div className="fixed z-50 space-y-3 top-6 right-6">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-500 transform animate-slideInRight max-w-sm ${
                notification.type === 'success' 
                  ? 'bg-green-50/90 border-green-200/50 text-green-800 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400' 
                  : notification.type === 'error'
                  ? 'bg-red-50/90 border-red-200/50 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'
                  : notification.type === 'warning'
                  ? 'bg-yellow-50/90 border-yellow-200/50 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/50 dark:text-yellow-400'
                  : 'bg-blue-50/90 border-blue-200/50 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-1 rounded-lg ${
                  notification.type === 'success' ? 'bg-green-200/50' :
                  notification.type === 'error' ? 'bg-red-200/50' :
                  notification.type === 'warning' ? 'bg-yellow-200/50' : 'bg-blue-200/50'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{notification.title || 'Notification'}</p>
                  <p className="text-sm opacity-90">{notification.message}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                  className="p-1 transition-colors rounded-lg hover:bg-black/10"
                >
                  <X className="w-4 h-4" />
                </button>
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