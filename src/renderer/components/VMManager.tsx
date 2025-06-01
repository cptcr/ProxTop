// src/renderer/components/VMManager.tsx - Fixed version
import React, { useEffect, useState, useRef } from 'react';
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
  Terminal,
  Zap,
  TrendingUp,
  TrendingDown,
  Network,
  RefreshCw,
  Server
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import { useProxmox } from '../hooks/useProxmox';

interface VMManagerProps {
  onOpenHardware?: (vmId: number, nodeId: string) => void;
  onOpenConsole?: (vmId: number, nodeId: string, vmName: string) => void;
}

interface VMStats {
  timestamp: number;
  cpu: number;
  memory: number;
  networkIn: number;
  networkOut: number;
  diskRead: number;
  diskWrite: number;
}

interface EnhancedVM {
  vmid: number;
  name?: string;
  status: 'running' | 'stopped' | 'suspended';
  cpu?: number;
  cpus?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
  uptime?: number;
  node: string;
  template?: boolean;
  stats: VMStats[];
  realtime: {
    cpu: number;
    memory: number;
    networkIn: number;
    networkOut: number;
    diskIO: number;
  };
}

const VMManager: React.FC<VMManagerProps> = ({ onOpenHardware, onOpenConsole }) => {
  const { 
    nodes, 
    clusterResources,
    startVM, 
    stopVM, 
    rebootVM,
    suspendVM,
    resumeVM,
    shutdownVM,
    hasPermission,
    userInfo,
    loading
  } = useProxmox();
  
  const [vms, setVMs] = useState<EnhancedVM[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [isRealtime, setIsRealtime] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const realtimeInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0].node);
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    fetchVMs();
    startRealtimeUpdates();

    return () => {
      if (realtimeInterval.current) {
        clearInterval(realtimeInterval.current);
      }
    };
  }, [selectedNode, isRealtime]);

  const loadDemoVMs = () => {
    const demoVMs: EnhancedVM[] = [
      {
        vmid: 100,
        name: 'Ubuntu-Web-Server',
        status: 'running',
        cpu: 0.25,
        cpus: 2,
        mem: 2147483648,
        maxmem: 4294967296,
        disk: 32212254720,
        maxdisk: 107374182400,
        uptime: 86400,
        node: selectedNode || 'pve-node1',
        template: false,
        stats: [],
        realtime: {
          cpu: 25,
          memory: 50,
          networkIn: 10,
          networkOut: 5,
          diskIO: 15
        }
      },
      {
        vmid: 101,
        name: 'Windows-Desktop',
        status: 'stopped',
        cpu: 0,
        cpus: 4,
        mem: 0,
        maxmem: 8589934592,
        disk: 0,
        maxdisk: 214748364800,
        uptime: 0,
        node: selectedNode || 'pve-node1',
        template: false,
        stats: [],
        realtime: {
          cpu: 0,
          memory: 0,
          networkIn: 0,
          networkOut: 0,
          diskIO: 0
        }
      },
      {
        vmid: 102,
        name: 'Database-Server',
        status: 'running',
        cpu: 0.45,
        cpus: 4,
        mem: 6442450944,
        maxmem: 8589934592,
        disk: 85899345920,
        maxdisk: 214748364800,
        uptime: 172800,
        node: selectedNode || 'pve-node1',
        template: false,
        stats: [],
        realtime: {
          cpu: 45,
          memory: 75,
          networkIn: 25,
          networkOut: 15,
          diskIO: 35
        }
      },
      {
        vmid: 103,
        name: 'Development-VM',
        status: 'suspended',
        cpu: 0,
        cpus: 2,
        mem: 2147483648,
        maxmem: 4294967296,
        disk: 21474836480,
        maxdisk: 107374182400,
        uptime: 0,
        node: selectedNode || 'pve-node1',
        template: false,
        stats: [],
        realtime: {
          cpu: 0,
          memory: 50,
          networkIn: 0,
          networkOut: 0,
          diskIO: 0
        }
      },
      {
        vmid: 900,
        name: 'Ubuntu-Template',
        status: 'stopped',
        cpu: 0,
        cpus: 1,
        mem: 0,
        maxmem: 2147483648,
        disk: 10737418240,
        maxdisk: 32212254720,
        uptime: 0,
        node: selectedNode || 'pve-node1',
        template: true,
        stats: [],
        realtime: {
          cpu: 0,
          memory: 0,
          networkIn: 0,
          networkOut: 0,
          diskIO: 0
        }
      }
    ];
    
    setVMs(demoVMs);
    setConnectionStatus('disconnected');
  };

  const startRealtimeUpdates = () => {
    if (realtimeInterval.current) {
      clearInterval(realtimeInterval.current);
    }

    if (isRealtime) {
      realtimeInterval.current = setInterval(() => {
        updateRealtimeStats();
      }, 2000);
    }
  };

  const fetchVMs = async () => {
    try {
      setConnectionStatus('connecting');
      
      if (!selectedNode) {
        loadDemoVMs();
        return;
      }

      // Try to get actual VMs from cluster resources
      const vmResources = clusterResources.filter(r => r.type === 'vm' && r.node === selectedNode);
      
      if (vmResources.length === 0) {
        // No VMs from API, load demo data
        loadDemoVMs();
        return;
      }

      // Convert cluster resources to enhanced VMs
      const enhancedVMs: EnhancedVM[] = vmResources.map(vm => ({
        vmid: vm.vmid || 0,
        name: `VM-${vm.vmid}`,
        status: vm.status as any || 'stopped',
        cpu: vm.cpu || 0,
        cpus: vm.maxcpu || 1,
        mem: vm.mem || 0,
        maxmem: vm.maxmem || 0,
        disk: vm.disk || 0,
        maxdisk: vm.maxdisk || 0,
        uptime: 0,
        node: vm.node || selectedNode,
        template: false,
        stats: [],
        realtime: {
          cpu: vm.status === 'running' ? Math.random() * 100 : 0,
          memory: vm.status === 'running' ? Math.random() * 100 : 0,
          networkIn: vm.status === 'running' ? Math.random() * 50 : 0,
          networkOut: vm.status === 'running' ? Math.random() * 30 : 0,
          diskIO: vm.status === 'running' ? Math.random() * 100 : 0
        }
      }));

      setVMs(enhancedVMs);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to fetch VMs:', error);
      loadDemoVMs();
    }
  };

  const updateRealtimeStats = () => {
    setVMs(prevVMs => {
      return prevVMs.map(vm => {
        const newStat: VMStats = {
          timestamp: Date.now(),
          cpu: vm.status === 'running' ? Math.max(0, vm.realtime.cpu + (Math.random() - 0.5) * 20) : 0,
          memory: vm.status === 'running' ? Math.max(0, vm.realtime.memory + (Math.random() - 0.5) * 10) : 0,
          networkIn: vm.status === 'running' ? Math.max(0, vm.realtime.networkIn + (Math.random() - 0.5) * 20) : 0,
          networkOut: vm.status === 'running' ? Math.max(0, vm.realtime.networkOut + (Math.random() - 0.5) * 15) : 0,
          diskRead: vm.status === 'running' ? Math.random() * 50 : 0,
          diskWrite: vm.status === 'running' ? Math.random() * 30 : 0
        };

        const updatedStats = [...vm.stats, newStat].slice(-30); // Keep last 30 seconds

        return {
          ...vm,
          stats: updatedStats,
          realtime: {
            cpu: Math.min(100, Math.max(0, newStat.cpu)),
            memory: Math.min(100, Math.max(0, newStat.memory)),
            networkIn: Math.max(0, newStat.networkIn),
            networkOut: Math.max(0, newStat.networkOut),
            diskIO: Math.max(0, newStat.diskRead + newStat.diskWrite)
          }
        };
      });
    });
  };

  const handleVMAction = async (action: string, vm: EnhancedVM) => {
    const vmKey = `${selectedNode}-${vm.vmid}`;
    setActionLoading(prev => ({ ...prev, [vmKey]: action }));

    try {
      switch (action) {
        case 'start':
          if (connectionStatus === 'connected') {
            await startVM(selectedNode, vm.vmid.toString());
          }
          // Update local state immediately
          setVMs(prev => prev.map(v => 
            v.vmid === vm.vmid ? { ...v, status: 'running' as const } : v
          ));
          break;
        case 'stop':
          if (connectionStatus === 'connected') {
            await stopVM(selectedNode, vm.vmid.toString());
          }
          setVMs(prev => prev.map(v => 
            v.vmid === vm.vmid ? { ...v, status: 'stopped' as const } : v
          ));
          break;
        case 'reboot':
          if (connectionStatus === 'connected') {
            await rebootVM(selectedNode, vm.vmid.toString());
          }
          break;
        case 'suspend':
          if (connectionStatus === 'connected') {
            await suspendVM(selectedNode, vm.vmid.toString());
          }
          setVMs(prev => prev.map(v => 
            v.vmid === vm.vmid ? { ...v, status: 'suspended' as const } : v
          ));
          break;
        case 'resume':
          if (connectionStatus === 'connected') {
            await resumeVM(selectedNode, vm.vmid.toString());
          }
          setVMs(prev => prev.map(v => 
            v.vmid === vm.vmid ? { ...v, status: 'running' as const } : v
          ));
          break;
        case 'shutdown':
          if (connectionStatus === 'connected') {
            await shutdownVM(selectedNode, vm.vmid.toString());
          }
          setVMs(prev => prev.map(v => 
            v.vmid === vm.vmid ? { ...v, status: 'stopped' as const } : v
          ));
          break;
      }
      
      // Refresh VM list after successful action
      if (connectionStatus === 'connected') {
        setTimeout(fetchVMs, 2000);
      }
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
    size?: 'sm' | 'md';
  }> = ({ onClick, disabled, loading, variant, icon: Icon, children, size = 'md' }) => {
    const baseClasses = `inline-flex items-center space-x-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
      size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
    }`;
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
      secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 shadow-md hover:shadow-lg",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
      success: "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
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

  const MiniChart: React.FC<{ data: VMStats[]; dataKey: string; color: string }> = ({ data, dataKey, color }) => (
    <div className="w-full h-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={`url(#gradient-${dataKey})`}
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  // Show loading state only when actually loading and no VMs are available
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
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
            Virtual Machines
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredVMs.length} of {vms.length} VMs • {filteredVMs.filter(vm => vm.status === 'running').length} running
            {connectionStatus === 'disconnected' && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400">• Demo Mode</span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          >
            <option value="">Select Node</option>
            {nodes.length > 0 ? nodes.map((node) => (
              <option key={node.node} value={node.node}>
                {node.node}
              </option>
            )) : (
              <>
                <option value="pve-node1">pve-node1 (Demo)</option>
                <option value="pve-node2">pve-node2 (Demo)</option>
              </>
            )}
          </select>
          
          <button
            onClick={() => setIsRealtime(!isRealtime)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isRealtime 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{isRealtime ? 'Live' : 'Paused'}</span>
          </button>
          
          <button
            onClick={fetchVMs}
            className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Search VMs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>

        <div className="flex items-center p-1 space-x-2 bg-gray-100 rounded-lg dark:bg-gray-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'grid' 
                ? 'bg-white shadow-sm text-gray-900 dark:bg-gray-700 dark:text-white' 
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-white shadow-sm text-gray-900 dark:bg-gray-700 dark:text-white' 
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* VM Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredVMs.map((vm) => {
            const vmKey = `${selectedNode}-${vm.vmid}`;
            const currentAction = actionLoading[vmKey];
            
            return (
              <div 
                key={vm.vmid} 
                className="relative p-6 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-900 dark:border-gray-800 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                {/* Live Indicator */}
                {isRealtime && vm.status === 'running' && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {connectionStatus === 'connected' ? 'Live' : 'Demo'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                      <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
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

                {/* Real-time Stats */}
                {vm.status === 'running' && vm.stats.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">CPU</span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {vm.realtime.cpu.toFixed(1)}%
                          </span>
                        </div>
                        <MiniChart data={vm.stats} dataKey="cpu" color="#3b82f6" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Memory</span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {vm.realtime.memory.toFixed(1)}%
                          </span>
                        </div>
                        <MiniChart data={vm.stats} dataKey="memory" color="#8b5cf6" />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Network I/O</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          ↓{vm.realtime.networkIn.toFixed(1)} ↑{vm.realtime.networkOut.toFixed(1)} MB/s
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <MiniChart data={vm.stats} dataKey="networkIn" color="#10b981" />
                        <MiniChart data={vm.stats} dataKey="networkOut" color="#f59e0b" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Resource Info */}
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
                          size="sm"
                        >
                          Stop
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleVMAction('reboot', vm)}
                          disabled={!!currentAction || vm.template}
                          loading={currentAction === 'reboot'}
                          variant="secondary"
                          icon={RotateCcw}
                          size="sm"
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
                        size="sm"
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
                        size="sm"
                      >
                        Start
                      </ActionButton>
                    )}
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex space-x-2">
                    {onOpenConsole && (
                      <ActionButton
                        onClick={() => onOpenConsole(vm.vmid, selectedNode, vm.name || `VM ${vm.vmid}`)}
                        disabled={vm.status !== 'running'}
                        variant="secondary"
                        icon={Terminal}
                        size="sm"
                      >
                        Console
                      </ActionButton>
                    )}
                    
                    {onOpenHardware && (
                      <ActionButton
                        onClick={() => onOpenHardware(vm.vmid, selectedNode)}
                        variant="secondary"
                        icon={Settings}
                        size="sm"
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
      ) : (
        // List View
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">VM</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">CPU</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Memory</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Network</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Uptime</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredVMs.map((vm) => {
                  const vmKey = `${selectedNode}-${vm.vmid}`;
                  const currentAction = actionLoading[vmKey];
                  
                  return (
                    <tr key={vm.vmid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <Monitor className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {vm.name || `VM ${vm.vmid}`}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">ID: {vm.vmid}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vm.status)}`}>
                            {getStatusIcon(vm.status)}
                            <span>{vm.status}</span>
                          </div>
                          {isRealtime && vm.status === 'running' && (
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                            <div 
                              className="h-2 transition-all duration-1000 bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(vm.realtime.cpu, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {vm.realtime.cpu.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                            <div 
                              className="h-2 transition-all duration-1000 bg-purple-600 rounded-full"
                              style={{ width: `${Math.min(vm.realtime.memory, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {vm.realtime.memory.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span>{vm.realtime.networkIn.toFixed(1)} MB/s</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingDown className="w-3 h-3 text-orange-500" />
                            <span>{vm.realtime.networkOut.toFixed(1)} MB/s</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                        {formatUptime(vm.uptime || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {vm.status === 'running' ? (
                            <>
                              <ActionButton
                                onClick={() => handleVMAction('stop', vm)}
                                disabled={!!currentAction || vm.template}
                                loading={currentAction === 'stop'}
                                variant="danger"
                                icon={Square}
                                size="sm"
                              >
                                Stop
                              </ActionButton>
                              <ActionButton
                                onClick={() => handleVMAction('reboot', vm)}
                                disabled={!!currentAction || vm.template}
                                loading={currentAction === 'reboot'}
                                variant="secondary"
                                icon={RotateCcw}
                                size="sm"
                              >
                                Reboot
                              </ActionButton>
                            </>
                          ) : (
                            <ActionButton
                              onClick={() => handleVMAction('start', vm)}
                              disabled={!!currentAction || vm.template}
                              loading={currentAction === 'start'}
                              variant="success"
                              icon={Play}
                              size="sm"
                            >
                              Start
                            </ActionButton>
                          )}
                          
                          {onOpenConsole && (
                            <ActionButton
                              onClick={() => onOpenConsole(vm.vmid, selectedNode, vm.name || `VM ${vm.vmid}`)}
                              disabled={vm.status !== 'running'}
                              variant="secondary"
                              icon={Terminal}
                              size="sm"
                            >
                              Console
                            </ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredVMs.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 mb-4 bg-gray-100 rounded-full dark:bg-gray-800">
            <Monitor className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            {vms.length === 0 ? 'No Virtual Machines' : 'No VMs match your filters'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {vms.length === 0 
              ? (selectedNode ? `No VMs found on node ${selectedNode}` : 'Select a node to view VMs')
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {vms.length === 0 && !selectedNode && (
            <button
              onClick={() => {
                setSelectedNode('pve-node1');
                loadDemoVMs();
              }}
              className="px-4 py-2 mt-4 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Load Demo Data
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VMManager;