import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Monitor, 
  HardDrive, 
  Network, 
  Archive, 
  Settings,
  Box,
  Database,
  Layers,
  Users,
  Disc,
  Moon,
  Sun
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

// Define the connection state type to match Settings component expectations
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

  // Create a connection state that matches Settings component expectations
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

    // Fix the useEffect cleanup function
    const removeListener = window.electronAPI.onMenuConnect(() => {
      setActiveTab('instances');
    });

    return () => {
      if (removeListener && typeof removeListener === 'function') {
        removeListener();
      }
    };
  }, []);

  // Update connection state when current instance changes
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
    { id: 'dashboard', label: 'Dashboard', icon: Monitor, requiresConnection: true },
    { id: 'nodes', label: 'Nodes', icon: Server, requiresConnection: true },
    { id: 'vms', label: 'Virtual Machines', icon: Box, requiresConnection: true },
    { id: 'containers', label: 'Containers', icon: Database, requiresConnection: true },
    { id: 'storage', label: 'Storage', icon: HardDrive, requiresConnection: true },
    { id: 'network', label: 'Network', icon: Network, requiresConnection: true },
    { id: 'backups', label: 'Backups', icon: Archive, requiresConnection: true },
    { id: 'iso', label: 'ISO Images', icon: Disc, requiresConnection: true },
    { id: 'users', label: 'User Management', icon: Users, requiresConnection: true },
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
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Layers className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              No Active Connection
            </h2>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Please connect to a Proxmox instance to continue
            </p>
            <button
              onClick={() => setActiveTab('instances')}
              className="btn-primary"
            >
              Manage Instances
            </button>
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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg dark:bg-gray-800">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Proxmox VE Manager</h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
          {currentInstance?.connected && (
            <div className="mt-1">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">{currentInstance.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentInstance.host}:{currentInstance.port}</p>
            </div>
          )}
        </div>
        <nav className="mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isDisabled = tab.requiresConnection && !currentInstance?.connected;
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id as TabType)}
                disabled={isDisabled}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  isDisabled 
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600 text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        {renderContent()}
      </div>

      {/* VM Hardware Configuration Modal */}
      {showVMHardware && (
        <VMHardwareManager
          vmId={showVMHardware.vmId}
          nodeId={showVMHardware.nodeId}
          onClose={() => setShowVMHardware(null)}
        />
      )}

      {/* VM Console Modal */}
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