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
  Server
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
    { id: 'instances', label: 'Instances', icon: Layers },
    { id: 'dashboard', label: 'Dashboard', icon: Activity, requiresConnection: true },
    { id: 'nodes', label: 'Nodes', icon: Server, requiresConnection: true },
    { id: 'vms', label: 'Virtual Machines', icon: Monitor, requiresConnection: true },
    { id: 'containers', label: 'Containers', icon: Database, requiresConnection: true },
    { id: 'storage', label: 'Storage', icon: HardDrive, requiresConnection: true },
    { id: 'network', label: 'Network', icon: Network, requiresConnection: true },
    { id: 'backups', label: 'Backups', icon: Archive, requiresConnection: true },
    { id: 'iso', label: 'ISO Images', icon: Disc, requiresConnection: true },
    { id: 'users', label: 'Users', icon: Users, requiresConnection: true },
    { id: 'settings', label: 'Settings', icon: Settings },
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
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <div className="p-8 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <Layers className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                No Active Connection
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Connect to a Proxmox instance to access cluster management features
              </p>
              <button
                onClick={() => setActiveTab('instances')}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              ProxTop
            </h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Connection Status */}
          {currentInstance?.connected && (
            <div className="p-3 border border-green-200 rounded-md bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">
                    {currentInstance.name}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    {currentInstance.host}:{currentInstance.port}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isDisabled = tab.requiresConnection && !currentInstance?.connected;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id as TabType)}
                  disabled={isDisabled}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isDisabled 
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  } ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="flex-shrink-0 w-5 h-5 mr-3" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
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