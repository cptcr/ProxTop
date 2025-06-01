import React, { useState, useEffect } from 'react';
import { Plus, Server, Edit, Trash2, Play, Square, Settings as SettingsIcon } from 'lucide-react';

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

interface InstanceManagerProps {
  currentInstance: ProxmoxInstance | null;
  setCurrentInstance: (instance: ProxmoxInstance | null) => void;
}

const InstanceManager: React.FC<InstanceManagerProps> = ({ currentInstance, setCurrentInstance }) => {
  const [instances, setInstances] = useState<ProxmoxInstance[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<ProxmoxInstance | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 8006,
    username: 'root',
    password: '',
    realm: 'pam',
    ignoreSSL: true,
  });

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = () => {
    const savedInstances = localStorage.getItem('proxmox-instances');
    if (savedInstances) {
      try {
        const parsed = JSON.parse(savedInstances);
        setInstances(parsed);
      } catch (error) {
        console.error('Failed to parse saved instances:', error);
      }
    }
  };

  const saveInstances = (newInstances: ProxmoxInstance[]) => {
    localStorage.setItem('proxmox-instances', JSON.stringify(newInstances));
    setInstances(newInstances);
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const instanceData: ProxmoxInstance = {
      id: editingInstance?.id || generateId(),
      name: formData.name,
      host: formData.host,
      port: formData.port,
      username: formData.username,
      password: formData.password,
      realm: formData.realm,
      ignoreSSL: formData.ignoreSSL,
      connected: false,
    };

    let newInstances;
    if (editingInstance) {
      newInstances = instances.map(instance => 
        instance.id === editingInstance.id ? instanceData : instance
      );
    } else {
      newInstances = [...instances, instanceData];
    }

    saveInstances(newInstances);
    setShowCreateModal(false);
    setEditingInstance(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: 8006,
      username: 'root',
      password: '',
      realm: 'pam',
      ignoreSSL: true,
    });
  };

  const handleEdit = (instance: ProxmoxInstance) => {
    setEditingInstance(instance);
    setFormData({
      name: instance.name,
      host: instance.host,
      port: instance.port,
      username: instance.username,
      password: instance.password,
      realm: instance.realm,
      ignoreSSL: instance.ignoreSSL,
    });
    setShowCreateModal(true);
  };

  const handleDelete = (instanceId: string) => {
    if (confirm('Are you sure you want to delete this instance?')) {
      const newInstances = instances.filter(instance => instance.id !== instanceId);
      saveInstances(newInstances);
      
      if (currentInstance?.id === instanceId) {
        setCurrentInstance(null);
      }
    }
  };

  const handleConnect = async (instance: ProxmoxInstance) => {
    try {
      const result = await window.electronAPI.connect(instance);
      if (result.success) {
        const updatedInstance = {
          ...instance,
          connected: true,
          lastConnected: new Date(),
        };
        
        const newInstances = instances.map(inst => 
          inst.id === instance.id ? updatedInstance : { ...inst, connected: false }
        );
        saveInstances(newInstances);
        setCurrentInstance(updatedInstance);
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Connection error: ${(error as Error).message}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await window.electronAPI.disconnect();
      const newInstances = instances.map(inst => ({ ...inst, connected: false }));
      saveInstances(newInstances);
      setCurrentInstance(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Proxmox Instances</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Instance</span>
        </button>
      </div>

      {currentInstance && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-800">Connected to {currentInstance.name}</h3>
              <p className="text-sm text-green-600">{currentInstance.host}:{currentInstance.port}</p>
            </div>
            <button
              onClick={handleDisconnect}
              className="btn-danger"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instances.map((instance) => (
          <div key={instance.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Server className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">{instance.name}</h3>
                  <p className="text-sm text-gray-500">{instance.host}:{instance.port}</p>
                </div>
              </div>
              <span className={instance.connected ? 'status-running' : 'status-stopped'}>
                {instance.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Username:</span>
                <span>{instance.username}@{instance.realm}</span>
              </div>
              {instance.lastConnected && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last connected:</span>
                  <span>{new Date(instance.lastConnected).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              {instance.connected ? (
                <button
                  onClick={handleDisconnect}
                  className="btn-danger flex items-center space-x-1 flex-1"
                >
                  <Square className="h-4 w-4" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(instance)}
                  className="btn-success flex items-center space-x-1 flex-1"
                >
                  <Play className="h-4 w-4" />
                  <span>Connect</span>
                </button>
              )}
              <button
                onClick={() => handleEdit(instance)}
                className="btn-secondary p-2"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(instance.id)}
                className="btn-danger p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {instances.length === 0 && (
        <div className="text-center py-12">
          <Server className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Instances</h3>
          <p className="text-gray-500 mb-4">Add your first Proxmox instance to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Add Instance
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingInstance ? 'Edit Instance' : 'Add New Instance'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instance Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Production Cluster"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Host/IP</label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="192.168.1.100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Port</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="65535"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Realm</label>
                    <select
                      value={formData.realm}
                      onChange={(e) => setFormData(prev => ({ ...prev, realm: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pam">Linux PAM</option>
                      <option value="pve">Proxmox VE</option>
                      <option value="ad">Active Directory</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ignoreSSL"
                    checked={formData.ignoreSSL}
                    onChange={(e) => setFormData(prev => ({ ...prev, ignoreSSL: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ignoreSSL" className="ml-2 block text-sm text-gray-700">
                    Ignore SSL certificate errors
                  </label>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingInstance(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingInstance ? 'Update' : 'Add'} Instance
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstanceManager;