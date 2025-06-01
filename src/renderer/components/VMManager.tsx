import React, { useEffect, useState } from 'react';
import { Monitor, Play, Square, RotateCcw, Settings, AlertCircle } from 'lucide-react';
import { useProxmox } from '../hooks/useProxmox';
import { ProxmoxVM } from '../types/proxmox';

const VMManager: React.FC = () => {
  const { nodes, startVM, stopVM, rebootVM, getVMs } = useProxmox();
  const [vms, setVMs] = useState<ProxmoxVM[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0].node);
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    if (selectedNode) {
      fetchVMs();
    }
  }, [selectedNode]);

  const fetchVMs = async () => {
    if (!selectedNode) return;
    
    setLoading(true);
    try {
      const vmData = await getVMs(selectedNode);
      setVMs(vmData);
    } catch (error) {
      console.error('Failed to fetch VMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVMAction = async (action: string, vmId: number) => {
    const vmKey = `${selectedNode}-${vmId}`;
    setActionLoading(prev => ({ ...prev, [vmKey]: action }));

    try {
      switch (action) {
        case 'start':
          await startVM(selectedNode, vmId.toString());
          break;
        case 'stop':
          await stopVM(selectedNode, vmId.toString());
          break;
        case 'reboot':
          await rebootVM(selectedNode, vmId.toString());
          break;
      }
      
      // Refresh VM list after action
      setTimeout(fetchVMs, 2000);
    } catch (error) {
      console.error(`Failed to ${action} VM:`, error);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[vmKey];
        return newState;
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return 'Stopped';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Virtual Machines</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Node</option>
            {nodes.map((node) => (
              <option key={node.node} value={node.node}>
                {node.node}
              </option>
            ))}
          </select>
          <button
            onClick={fetchVMs}
            disabled={!selectedNode}
            className="btn-primary"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vms.map((vm) => {
            const vmKey = `${selectedNode}-${vm.vmid}`;
            const currentAction = actionLoading[vmKey];
            
            return (
              <div key={vm.vmid} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Monitor className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">{vm.name || `VM ${vm.vmid}`}</h3>
                      <p className="text-sm text-gray-500">ID: {vm.vmid}</p>
                    </div>
                  </div>
                  <span className={vm.status === 'running' ? 'status-running' : 'status-stopped'}>
                    {vm.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">CPUs:</span>
                    <span className="text-sm font-medium">{vm.cpus || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Memory:</span>
                    <span className="text-sm font-medium">{formatBytes(vm.maxmem || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Storage:</span>
                    <span className="text-sm font-medium">{formatBytes(vm.maxdisk || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Uptime:</span>
                    <span className="text-sm font-medium">{formatUptime(vm.uptime || 0)}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {vm.status === 'running' ? (
                    <>
                      <button
                        onClick={() => handleVMAction('stop', vm.vmid)}
                        disabled={!!currentAction}
                        className="btn-danger flex items-center space-x-1 flex-1"
                      >
                        {currentAction === 'stop' ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                        <span>Stop</span>
                      </button>
                      <button
                        onClick={() => handleVMAction('reboot', vm.vmid)}
                        disabled={!!currentAction}
                        className="btn-secondary flex items-center space-x-1 flex-1"
                      >
                        {currentAction === 'reboot' ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        <span>Reboot</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleVMAction('start', vm.vmid)}
                      disabled={!!currentAction}
                      className="btn-success flex items-center space-x-1 flex-1"
                    >
                      {currentAction === 'start' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      <span>Start</span>
                    </button>
                  )}
                  <button className="btn-secondary p-2">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vms.length === 0 && !loading && (
        <div className="text-center py-12">
          <Monitor className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Virtual Machines</h3>
          <p className="text-gray-500">
            {selectedNode ? `No VMs found on node ${selectedNode}` : 'Select a node to view VMs'}
          </p>
        </div>
      )}
    </div>
  );
};

export default VMManager;