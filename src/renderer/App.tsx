// src/renderer/App.tsx - Clean, minimalistic UI with real Proxmox data only
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
  AlertTriangle
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

  const openVMHardware = (vmId: number, nodeId: string) => {
    setShowVMHardware({ vmId, nodeId });
  };

  const openVMConsole = (vmId: number, nodeId: string, vmName: string) => {
    setShowVMConsole({ vmId, nodeId, vmName });
  };

  const renderContent = () => {
    // Only show connection prompt for tabs that require connection
    if (activeTab !== 'instances' && activeTab !== 'settings' && !currentInstance?.connected) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="max-w-lg p-8 mx-auto bg-white border shadow-lg rounded-2xl dark:bg-gray-800 dark:border-gray-700">
              <div className="mb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full dark:bg-blue-900">
                  <Cloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  No Active Connection
                </h2>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  Connect to a Proxmox cluster to access management features.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('instances')}
                className="btn-primary"
              >
                <Layers className="inline w-4 h-4 mr-2" />
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
        {currentInstance?.connected && !sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800 truncate dark:text-green-400">
                    {currentInstance.name}
                  </p>
                  <p className="text-xs text-green-600 truncate dark:text-green-500">
                    {currentInstance.host}:{currentInstance.port}
                  </p>
                </div>
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
                  const isDisabled = item.requiresConnection && !currentInstance?.connected;
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
                      <Icon className="flex-shrink-0 w-5 h-5" />
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
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Modals */}
      {showVMHardware && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-4xl">
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