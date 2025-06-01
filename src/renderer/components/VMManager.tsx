// src/renderer/components/VMManager.tsx
import React, { useEffect, useState } from 'react';
import { 
  Monitor, 
  Play, 
  Square, 
  RotateCcw, 
  Search,
  Filter,
  MoreVertical,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  Power,
  Copy,
  Trash2,
  Settings,
  Terminal
} from 'lucide-react';
import { useProxmox } from '../hooks/useProxmox';
import { ProxmoxVM } from '../types/proxmox';

interface VMManagerProps {
  onOpenHardware?: (vmId: number, nodeId: string) => void;
  onOpenConsole?: (vmId: number, nodeId: string, vmName: string) => void;
}

const VMManager: React.FC<VMManagerProps> = ({ onOpenHardware, onOpenConsole }) => {
  const { 
    nodes, 
    startVM, 
    stopVM, 
    rebootVM,
    suspendVM,
    resumeVM,
    shutdownVM,
    getFilteredVMs,
    hasPermission,
    userInfo
  } = useProxmox();
  
  const [vms, setVMs] = useState<ProxmoxVM[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');

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
      const vmData = await getFilteredVMs(selectedNode);
      setVMs(vmData);
    } catch (error) {
      console.error('Failed to fetch VMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVMAction = async (action: string, vm: ProxmoxVM) => {
    const vmKey = `${selectedNode}-${vm.vmid}`;
    setActionLoading(prev => ({ ...prev, [vmKey]: action }));

    try {
      switch (action) {
        case 'start':
          await startVM(selectedNode, vm.vmid.toString());
          break;
        case 'stop':
          await stopVM(selectedNode, vm.vmid.toString());
          break;
        case 'reboot':
          await rebootVM(selectedNode, vm.vmid.toString());
          break;
        case 'suspend':
          await suspendVM(selectedNode, vm.vmid.toString());
          break;
        case 'resume':
          await resumeVM(selectedNode, vm.vmid.toString());
          break;
        case 'shutdown':
          await shutdownVM(selectedNode, vm.vmid.toString());
          break;
      }
      
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return 'Stopped';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'stopped':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'suspended':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'stopped':
        return <AlertCircle className="w-4 h-4" />;
      case 'suspended':
        return <Pause className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const filteredVMs = vms.filter(vm => {
    const matchesSearch = searchTerm === '' || 
      vm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vm.vmid.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || vm.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const ActionButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant: 'primary' | 'secondary' | 'danger' | 'success';
    icon: React.ComponentType<any>;
    children: React.ReactNode;
  }> = ({ onClick, disabled, loading, variant, icon: Icon, children }) => {
    const baseClasses = "inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
      danger: "bg-red-600 text-white hover:bg-red-700",
      success: "bg-green-600 text-white hover:bg-green-700"
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variants[variant]}`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        <span>{children}</span>
      </button>
    );
  };

  if (loading && vms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading virtual machines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Virtual Machines</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredVMs.length} of {vms.length} VMs • {filteredVMs.filter(vm => vm.status === 'running').length} running
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Search VMs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>
      </div>

      {/* VM Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredVMs.map((vm) => {
          const vmKey = `${selectedNode}-${vm.vmid}`;
          const currentAction = actionLoading[vmKey];
          
          return (
            <div 
              key={vm.vmid} 
              className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {vm.name || `VM ${vm.vmid}`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {vm.vmid}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vm.status)}`}>
                    {getStatusIcon(vm.status)}
                    <span>{vm.status}</span>
                  </div>
                  
                  {vm.template && (
                    <span className="px-2 py-1 text-xs font-medium text-purple-600 rounded-full bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400">
                      Template
                    </span>
                  )}
                </div>
              </div>

              {/* Resource Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">CPUs</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{vm.cpus || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MemoryStick className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Memory</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatBytes(vm.maxmem || 0)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Storage</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatBytes(vm.maxdisk || 0)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Uptime</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatUptime(vm.uptime || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Usage Bars - Only for running VMs */}
              {vm.status === 'running' && (
                <div className="mb-4 space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">CPU Usage</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">{((vm.cpu || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                      <div 
                        className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
                        style={{ width: `${Math.min((vm.cpu || 0) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Memory Usage</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {(((vm.mem || 0) / (vm.maxmem || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                      <div 
                        className="h-2 transition-all duration-300 bg-purple-600 rounded-full"
                        style={{ width: `${Math.min(((vm.mem || 0) / (vm.maxmem || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary Actions */}
                <div className="flex space-x-2">
                  {vm.status === 'running' ? (
                    <>
                      <ActionButton
                        onClick={() => handleVMAction('stop', vm)}
                        disabled={!!currentAction || vm.template}
                        loading={currentAction === 'stop'}
                        variant="danger"
                        icon={Square}
                      >
                        Stop
                      </ActionButton>
                      <ActionButton
                        onClick={() => handleVMAction('reboot', vm)}
                        disabled={!!currentAction || vm.template}
                        loading={currentAction === 'reboot'}
                        variant="secondary"
                        icon={RotateCcw}
                      >
                        Reboot
                      </ActionButton>
                    </>
                  ) : vm.status === 'suspended' ? (
                    <ActionButton
                      onClick={() => handleVMAction('resume', vm)}
                      disabled={!!currentAction}
                      loading={currentAction === 'resume'}
                      variant="success"
                      icon={Play}
                    >
                      Resume
                    </ActionButton>
                  ) : (
                    <ActionButton
                      onClick={() => handleVMAction('start', vm)}
                      disabled={!!currentAction || vm.template}
                      loading={currentAction === 'start'}
                      variant="success"
                      icon={Play}
                    >
                      Start
                    </ActionButton>
                  )}
                </div>

                {/* Secondary Actions */}
                <div className="flex space-x-2">
                  {onOpenConsole && hasPermission(`/vms/${vm.vmid}`, 'VM.Console') && (
                    <ActionButton
                      onClick={() => onOpenConsole(vm.vmid, selectedNode, vm.name || `VM ${vm.vmid}`)}
                      disabled={vm.status !== 'running'}
                      variant="secondary"
                      icon={Terminal}
                    >
                      Console
                    </ActionButton>
                  )}
                  
                  {onOpenHardware && hasPermission(`/vms/${vm.vmid}`, 'VM.Config') && (
                    <ActionButton
                      onClick={() => onOpenHardware(vm.vmid, selectedNode)}
                      variant="secondary"
                      icon={Settings}
                    >
                      Config
                    </ActionButton>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredVMs.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Monitor className="w-16 h-16 mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            {vms.length === 0 ? 'No Virtual Machines' : 'No VMs match your filters'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {vms.length === 0 
              ? (selectedNode ? `No VMs found on node ${selectedNode}` : 'Select a node to view VMs')
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default VMManager;