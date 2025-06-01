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
  Layers
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import NodeManager from './components/NodeManager';
import VMManager from './components/VMManager';
import ContainerManager from './components/ContainerManager';
import StorageManager from './components/StorageManager';
import NetworkManager from './components/NetworkManager';
import BackupManager from './components/BackupManager';
import SettingsComponent from './components/Settings';
import InstanceManager from './components/InstanceManager';

type TabType = 'dashboard' | 'nodes' | 'vms' | 'containers' | 'storage' | 'network' | 'backups' | 'instances' | 'settings';

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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('instances');
  const [currentInstance, setCurrentInstance] = useState<ProxmoxInstance | null>(null);

  useEffect(() => {
    // Load last connected instance on startup
    const savedInstances = localStorage.getItem('proxmox-instances');
    if (savedInstances) {
      try {
        const instances = JSON.parse(savedInstances);
        const connectedInstance = instances.find((inst: ProxmoxInstance) => inst.connected);
        if (connectedInstance) {
          setCurrentInstance(connectedInstance);
          setActiveTab('dashboard');
        }
      } catch (error) {
        console.error('Failed to load instances:', error);
      }
    }

    const removeListener = window.electronAPI.onMenuConnect(() => {
      setActiveTab('instances');
    });

    return removeListener;
  }, []);

  const tabs = [
    { id: 'instances', label: 'Instances', icon: Layers },
    { id: 'dashboard', label: 'Dashboard', icon: Monitor, requiresConnection: true },
    { id: 'nodes', label: 'Nodes', icon: Server, requiresConnection: true },
    { id: 'vms', label: 'Virtual Machines', icon: Box, requiresConnection: true },
    { id: 'containers', label: 'Containers', icon: Database, requiresConnection: true },
    { id: 'storage', label: 'Storage', icon: HardDrive, requiresConnection: true },
    { id: 'network', label: 'Network', icon: Network, requiresConnection: true },
    { id: 'backups', label: 'Backups', icon: Archive, requiresConnection: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    if (activeTab !== 'instances' && activeTab !== 'settings' && !currentInstance?.connected) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Layers className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Active Connection
            </h2>
            <p className="text-gray-500 mb-4">
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
        return <VMManager />;
      case 'containers':
        return <ContainerManager />;
      case 'storage':
        return <StorageManager />;
      case 'network':
        return <NetworkManager />;
      case 'backups':
        return <BackupManager />;
      case 'settings':
        return (
          <SettingsComponent 
            connection={{
              connected: currentInstance?.connected || false,
              config: currentInstance || null
            }} 
            setConnection={(newConnection) => {
              if (newConnection.connected && newConnection.config) {
                setCurrentInstance(newConnection.config as ProxmoxInstance);
              } else {
                setCurrentInstance(null);
              }
            }} 
          />
        );
      default:
        return <InstanceManager currentInstance={currentInstance} setCurrentInstance={setCurrentInstance} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Proxmox VE Manager</h1>
          {currentInstance?.connected && (
            <div className="mt-1">
              <p className="text-sm text-green-600 font-medium">{currentInstance.name}</p>
              <p className="text-xs text-gray-500">{currentInstance.host}:{currentInstance.port}</p>
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
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-50'
                } ${
                  activeTab === tab.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-700' : 'text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;