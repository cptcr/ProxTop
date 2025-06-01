import React, { useEffect, useState } from 'react';
import { Monitor, Play, Square, RotateCcw, Settings, AlertCircle, Terminal, Wrench } from 'lucide-react';
import { useProxmox } from '../hooks/useProxmox';
import { ProxmoxVM } from '../types/proxmox';

interface VMManagerProps {
  onOpenHardware?: (vmId: number, nodeId: string) => void;
  onOpenConsole?: (vmId: number, nodeId: string, vmName: string) => void;
}

const VMManager: React.FC<VMManagerProps> = ({ onOpenHardware, onOpenConsole }) => {
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
    <div className="h-full p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Virtual Machines</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
          <div className="w-16 h-16 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vms.map((vm) => {
            const vmKey = `${selectedNode}-${vm.vmid}`;
            const currentAction = actionLoading[vmKey];
            
            return (
              <div key={vm.vmid} className="bg-white border-gray-200 card dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Monitor className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {vm.name || `VM ${vm.vmid}`}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">ID: {vm.vmid}</p>
                    </div>
                  </div>
                  <span className={vm.status === 'running' ? 'status-running' : 'status-stopped'}>
                    {vm.status}
                  </span>
                </div>

                <div className="mb-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">CPUs:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{vm.cpus || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Memory:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatBytes(vm.maxmem || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Storage:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatBytes(vm.maxdisk || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Uptime:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatUptime(vm.uptime || 0)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Primary Actions */}
                  <div className="flex space-x-2">
                    {vm.status === 'running' ? (
                      <>
                        <button
                          onClick={() => handleVMAction('stop', vm.vmid)}
                          disabled={!!currentAction}
                          className="flex items-center flex-1 space-x-1 text-sm btn-danger"
                        >
                          {currentAction === 'stop' ? (
                            <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          <span>Stop</span>
                        </button>
                        <button
                          onClick={() => handleVMAction('reboot', vm.vmid)}
                          disabled={!!currentAction}
                          className="flex items-center flex-1 space-x-1 text-sm btn-secondary"
                        >
                          {currentAction === 'reboot' ? (
                            <div className="w-4 h-4 border-b-2 border-gray-600 rounded-full animate-spin"></div>
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          <span>Reboot</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleVMAction('start', vm.vmid)}
                        disabled={!!currentAction}
                        className="flex items-center flex-1 space-x-1 text-sm btn-success"
                      >
                        {currentAction === 'start' ? (
                          <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>Start</span>
                      </button>
                    )}
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex space-x-2">
                    {onOpenConsole && (
                      <button
                        onClick={() => onOpenConsole(vm.vmid, selectedNode, vm.name || `VM ${vm.vmid}`)}
                        disabled={vm.status !== 'running'}
                        className="flex items-center flex-1 space-x-1 text-sm btn-secondary disabled:opacity-50"
                        title="Open Console"
                      >
                        <Terminal className="w-4 h-4" />
                        <span>Console</span>
                      </button>
                    )}
                    
                    {onOpenHardware && (
                      <button
                        onClick={() => onOpenHardware(vm.vmid, selectedNode)}
                        className="flex items-center flex-1 space-x-1 text-sm btn-secondary"
                        title="Hardware Configuration"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Hardware</span>
                      </button>
                    )}
                    
                    <button 
                      className="p-2 btn-secondary"
                      title="More Options"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vms.length === 0 && !loading && (
        <div className="py-12 text-center">
          <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">No Virtual Machines</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedNode ? `No VMs found on node ${selectedNode}` : 'Select a node to view VMs'}
          </p>
        </div>
      )}
    </div>
  );
};

export default VMManager;