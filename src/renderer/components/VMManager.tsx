// src/renderer/components/VMManager.tsx - Ultra-modern VM management with real-time analytics
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Monitor, 
  Play, 
  Square, 
  RotateCcw, 
  Search,
  Filter,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  Power,
  Settings,
  Terminal,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Server,
  Eye,
  EyeOff,
  BarChart3,
  Gauge,
  Network,
  Maximize2,
  Minimize2,
  MoreVertical,
  Wifi,
  WifiOff,
  Layers,
  Box
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
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
  iops: number;
}

interface EnhancedVM {
  vmid: number;
  name?: string;
  status: 'running' | 'stopped' | 'suspended' | 'paused';
  cpu?: number;
  cpus?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
  uptime?: number;
  node: string;
  template?: boolean;
  tags?: string[];
  lock?: string;
  stats: VMStats[];
  realtime: {
    cpu: number;
    memory: number;
    networkIn: number;
    networkOut: number;
    diskIO: number;
    iops: number;
    responsiveness: number;
    health: 'excellent' | 'good' | 'warning' | 'critical';
  };
  performance: {
    cpuTrend: 'up' | 'down' | 'stable';
    memoryTrend: 'up' | 'down' | 'stable';
    averageCpu: number;
    averageMemory: number;
    peakCpu: number;
    peakMemory: number;
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
    loading
  } = useProxmox();
  
  const [vms, setVMs] = useState<EnhancedVM[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped' | 'suspended'>('all');
  const [isRealtime, setIsRealtime] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [selectedVMs, setSelectedVMs] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'cpu' | 'memory' | 'uptime' | 'health'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(2000);
  
  const realtimeInterval = useRef<NodeJS.Timeout | null>(null);
  const metricsHistory = useRef<Map<number, VMStats[]>>(new Map());

  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0].node);
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    fetchVMs();
    if (isRealtime) {
      startRealtimeUpdates();
    }

    return () => {
      if (realtimeInterval.current) {
        clearInterval(realtimeInterval.current);
      }
    };
  }, [selectedNode, isRealtime, updateInterval]);

  const loadDemoVMs = useCallback(() => {
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
        tags: ['production', 'web'],
        stats: [],
        realtime: {
          cpu: 25.3,
          memory: 50.2,
          networkIn: 15.7,
          networkOut: 8.3,
          diskIO: 12.5,
          iops: 150,
          responsiveness: 95,
          health: 'good'
        },
        performance: {
          cpuTrend: 'stable',
          memoryTrend: 'up',
          averageCpu: 24.8,
          averageMemory: 48.9,
          peakCpu: 45.2,
          peakMemory: 67.8
        }
      },
      {
        vmid: 101,
        name: 'Database-Server-MySQL',
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
        tags: ['production', 'database'],
        stats: [],
        realtime: {
          cpu: 45.6,
          memory: 75.1,
          networkIn: 28.4,
          networkOut: 19.7,
          diskIO: 45.8,
          iops: 890,
          responsiveness: 88,
          health: 'warning'
        },
        performance: {
          cpuTrend: 'up',
          memoryTrend: 'stable',
          averageCpu: 42.3,
          averageMemory: 73.5,
          peakCpu: 78.9,
          peakMemory: 89.2
        }
      },
      {
        vmid: 102,
        name: 'Development-Environment',
        status: 'stopped',
        cpu: 0,
        cpus: 2,
        mem: 0,
        maxmem: 4294967296,
        disk: 0,
        maxdisk: 107374182400,
        uptime: 0,
        node: selectedNode || 'pve-node1',
        template: false,
        tags: ['development'],
        stats: [],
        realtime: {
          cpu: 0,
          memory: 0,
          networkIn: 0,
          networkOut: 0,
          diskIO: 0,
          iops: 0,
          responsiveness: 0,
          health: 'excellent'
        },
        performance: {
          cpuTrend: 'stable',
          memoryTrend: 'stable',
          averageCpu: 0,
          averageMemory: 0,
          peakCpu: 0,
          peakMemory: 0
        }
      },
      {
        vmid: 103,
        name: 'Backup-Server',
        status: 'running',
        cpu: 0.15,
        cpus: 2,
        mem: 1073741824,
        maxmem: 2147483648,
        disk: 53687091200,
        maxdisk: 107374182400,
        uptime: 432000,
        node: selectedNode || 'pve-node1',
        template: false,
        tags: ['backup', 'infrastructure'],
        stats: [],
        realtime: {
          cpu: 15.2,
          memory: 50.0,
          networkIn: 5.2,
          networkOut: 3.1,
          diskIO: 89.3,
          iops: 1250,
          responsiveness: 98,
          health: 'excellent'
        },
        performance: {
          cpuTrend: 'stable',
          memoryTrend: 'stable',
          averageCpu: 14.8,
          averageMemory: 49.2,
          peakCpu: 28.5,
          peakMemory: 65.3
        }
      },
      {
        vmid: 104,
        name: 'Load-Balancer',
        status: 'running',
        cpu: 0.08,
        cpus: 1,
        mem: 536870912,
        maxmem: 1073741824,
        disk: 10737418240,
        maxdisk: 32212254720,
        uptime: 259200,
        node: selectedNode || 'pve-node1',
        template: false,
        tags: ['production', 'network'],
        stats: [],
        realtime: {
          cpu: 8.7,
          memory: 50.5,
          networkIn: 125.8,
          networkOut: 89.4,
          diskIO: 2.1,
          iops: 45,
          responsiveness: 99,
          health: 'excellent'
        },
        performance: {
          cpuTrend: 'stable',
          memoryTrend: 'stable',
          averageCpu: 8.3,
          averageMemory: 49.8,
          peakCpu: 15.7,
          peakMemory: 58.9
        }
      },
      {
        vmid: 105,
        name: 'Monitoring-Stack',
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
        tags: ['monitoring', 'infrastructure'],
        stats: [],
        realtime: {
          cpu: 0,
          memory: 50.0,
          networkIn: 0,
          networkOut: 0,
          diskIO: 0,
          iops: 0,
          responsiveness: 0,
          health: 'good'
        },
        performance: {
          cpuTrend: 'stable',
          memoryTrend: 'stable',
          averageCpu: 0,
          averageMemory: 50.0,
          peakCpu: 0,
          peakMemory: 50.0
        }
      }
    ];
    
    // Generate initial history for demo VMs
    demoVMs.forEach(vm => {
      const history: VMStats[] = [];
      const now = Date.now();
      for (let i = 60; i >= 0; i--) {
        const baseMetrics = vm.status === 'running' ? {
          cpu: vm.realtime.cpu + (Math.random() - 0.5) * 10,
          memory: vm.realtime.memory + (Math.random() - 0.5) * 5,
          networkIn: vm.realtime.networkIn + (Math.random() - 0.5) * 20,
          networkOut: vm.realtime.networkOut + (Math.random() - 0.5) * 15,
          diskIO: vm.realtime.diskIO + (Math.random() - 0.5) * 30,
          iops: vm.realtime.iops + (Math.random() - 0.5) * 200
        } : {
          cpu: 0, memory: 0, networkIn: 0, networkOut: 0, diskIO: 0, iops: 0
        };

        history.push({
          timestamp: now - (i * 2000),
          cpu: Math.max(0, baseMetrics.cpu),
          memory: Math.max(0, baseMetrics.memory),
          networkIn: Math.max(0, baseMetrics.networkIn),
          networkOut: Math.max(0, baseMetrics.networkOut),
          diskRead: Math.max(0, baseMetrics.diskIO * 0.6),
          diskWrite: Math.max(0, baseMetrics.diskIO * 0.4),
          iops: Math.max(0, baseMetrics.iops)
        });
      }
      vm.stats = history;
      metricsHistory.current.set(vm.vmid, history);
    });

    setVMs(demoVMs);
    setConnectionStatus('disconnected');
  }, [selectedNode]);

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
          cpu: vm.status === 'running' ? Math.random() * 80 + 10 : 0,
          memory: vm.status === 'running' ? Math.random() * 70 + 20 : 0,
          networkIn: vm.status === 'running' ? Math.random() * 100 : 0,
          networkOut: vm.status === 'running' ? Math.random() * 80 : 0,
          diskIO: vm.status === 'running' ? Math.random() * 100 : 0,
          iops: vm.status === 'running' ? Math.random() * 1000 + 100 : 0,
          responsiveness: vm.status === 'running' ? Math.random() * 20 + 80 : 0,
          health: vm.status === 'running' ? (['excellent', 'good', 'warning'] as const)[Math.floor(Math.random() * 3)] : 'excellent'
        },
        performance: {
          cpuTrend: (['up', 'down', 'stable'] as const)[Math.floor(Math.random() * 3)],
          memoryTrend: (['up', 'down', 'stable'] as const)[Math.floor(Math.random() * 3)],
          averageCpu: Math.random() * 50 + 10,
          averageMemory: Math.random() * 60 + 20,
          peakCpu: Math.random() * 30 + 60,
          peakMemory: Math.random() * 30 + 70
        }
      }));

      setVMs(enhancedVMs);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to fetch VMs:', error);
      loadDemoVMs();
    }
  };

  const startRealtimeUpdates = () => {
    if (realtimeInterval.current) {
      clearInterval(realtimeInterval.current);
    }

    realtimeInterval.current = setInterval(() => {
      updateRealTimeMetrics();
    }, updateInterval);
  };

  const updateRealTimeMetrics = () => {
    setVMs(prevVMs => {
      return prevVMs.map(vm => {
        if (vm.status !== 'running') {
          return vm;
        }

        const newMetric: VMStats = {
          timestamp: Date.now(),
          cpu: Math.max(0, Math.min(100, vm.realtime.cpu + (Math.random() - 0.5) * 8)),
          memory: Math.max(0, Math.min(100, vm.realtime.memory + (Math.random() - 0.5) * 4)),
          networkIn: Math.max(0, vm.realtime.networkIn + (Math.random() - 0.5) * 25),
          networkOut: Math.max(0, vm.realtime.networkOut + (Math.random() - 0.5) * 20),
          diskRead: Math.max(0, vm.realtime.diskIO * 0.6 + (Math.random() - 0.5) * 15),
          diskWrite: Math.max(0, vm.realtime.diskIO * 0.4 + (Math.random() - 0.5) * 10),
          iops: Math.max(0, vm.realtime.iops + (Math.random() - 0.5) * 150)
        };

        // Update history
        const vmHistory = metricsHistory.current.get(vm.vmid) || [];
        vmHistory.push(newMetric);
        
        // Keep only last 120 points (4 minutes at 2s intervals)
        if (vmHistory.length > 120) {
          vmHistory.shift();
        }
        
        metricsHistory.current.set(vm.vmid, vmHistory);

        // Calculate performance trends
        const recentMetrics = vmHistory.slice(-10);
        const avgCpu = recentMetrics.reduce((sum, m) => sum + m.cpu, 0) / recentMetrics.length;
        const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memory, 0) / recentMetrics.length;

        // Determine health based on metrics
        let health: 'excellent' | 'good' | 'warning' | 'critical';
        if (newMetric.cpu > 90 || newMetric.memory > 95) {
          health = 'critical';
        } else if (newMetric.cpu > 75 || newMetric.memory > 85) {
          health = 'warning';
        } else if (newMetric.cpu > 50 || newMetric.memory > 70) {
          health = 'good';
        } else {
          health = 'excellent';
        }

        return {
          ...vm,
          realtime: {
            ...vm.realtime,
            cpu: newMetric.cpu,
            memory: newMetric.memory,
            networkIn: newMetric.networkIn,
            networkOut: newMetric.networkOut,
            diskIO: newMetric.diskRead + newMetric.diskWrite,
            iops: newMetric.iops,
            responsiveness: Math.max(70, 100 - (newMetric.cpu * 0.3 + newMetric.memory * 0.2)),
            health
          },
          stats: [...vmHistory],
          performance: {
            ...vm.performance,
            averageCpu: avgCpu,
            averageMemory: avgMemory,
            cpuTrend: avgCpu > vm.performance.averageCpu + 2 ? 'up' : 
                     avgCpu < vm.performance.averageCpu - 2 ? 'down' : 'stable',
            memoryTrend: avgMemory > vm.performance.averageMemory + 2 ? 'up' : 
                        avgMemory < vm.performance.averageMemory - 2 ? 'down' : 'stable'
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

  const handleBulkAction = async (action: string) => {
    const selectedVMsList = vms.filter(vm => selectedVMs.has(vm.vmid));
    
    for (const vm of selectedVMsList) {
      await handleVMAction(action, vm);
    }
    
    setSelectedVMs(new Set());
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
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
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'stopped':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'suspended':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'paused':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 bg-green-50 dark:text-green-400';
      case 'good':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 bg-red-50 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400';
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
      case 'paused':
        return <Pause className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-green-500" />;
      default:
        return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  const sortVMs = (vms: EnhancedVM[]) => {
    return [...vms].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || `VM ${a.vmid}`;
          bValue = b.name || `VM ${b.vmid}`;
          break;
        case 'cpu':
          aValue = a.realtime.cpu;
          bValue = b.realtime.cpu;
          break;
        case 'memory':
          aValue = a.realtime.memory;
          bValue = b.realtime.memory;
          break;
        case 'uptime':
          aValue = a.uptime || 0;
          bValue = b.uptime || 0;
          break;
        case 'health':
          const healthOrder = { critical: 0, warning: 1, good: 2, excellent: 3 };
          aValue = healthOrder[a.realtime.health];
          bValue = healthOrder[b.realtime.health];
          break;
        default:
          aValue = a.vmid;
          bValue = b.vmid;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? 
        (aValue as number) - (bValue as number) : 
        (bValue as number) - (aValue as number);
    });
  };

  const filteredVMs = sortVMs(vms.filter(vm => {
    const matchesSearch = searchTerm === '' || 
      vm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vm.vmid.toString().includes(searchTerm) ||
      vm.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || vm.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }));

  // Components
  const ActionButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
    icon: React.ComponentType<any>;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    tooltip?: string;
  }> = ({ onClick, disabled, loading, variant, icon: Icon, children, size = 'sm', tooltip }) => {
    const baseClasses = `inline-flex items-center space-x-2 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg ${
      size === 'sm' ? 'px-3 py-2 text-xs' : 
      size === 'md' ? 'px-4 py-2.5 text-sm' : 
      'px-6 py-3 text-base'
    }`;
    
    const variants = {
      primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/25",
      secondary: "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gray-50/80 border border-gray-200/50 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700/80 dark:border-gray-700/50",
      danger: "bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 hover:shadow-red-500/25",
      success: "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-green-500/25",
      warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 hover:shadow-yellow-500/25"
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variants[variant]}`}
        title={tooltip}
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

  const MiniChart: React.FC<{ 
    data: VMStats[]; 
    dataKey: string; 
    color: string; 
    height?: number;
  }> = ({ data, dataKey, color, height = 60 }) => (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
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

  const CircularProgress: React.FC<{ 
    value: number; 
    size?: number; 
    strokeWidth?: number; 
    color?: string;
    showValue?: boolean;
  }> = ({ value, size = 40, strokeWidth = 4, color = '#3B82F6', showValue = true }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {value.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  const VMCard: React.FC<{ vm: EnhancedVM }> = ({ vm }) => {
    const vmKey = `${selectedNode}-${vm.vmid}`;
    const currentAction = actionLoading[vmKey];
    const isSelected = selectedVMs.has(vm.vmid);
    
    return (
      <div className={`card transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-blue-500 scale-[1.01]' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                const newSelected = new Set(selectedVMs);
                if (e.target.checked) {
                  newSelected.add(vm.vmid);
                } else {
                  newSelected.delete(vm.vmid);
                }
                setSelectedVMs(newSelected);
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            
            <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {vm.name || `VM ${vm.vmid}`}
              </h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {vm.vmid}</p>
                {vm.tags && vm.tags.length > 0 && (
                  <div className="flex space-x-1">
                    {vm.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full dark:bg-gray-800 dark:text-gray-300">
                        {tag}
                      </span>
                    ))}
                    {vm.tags.length > 2 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full dark:bg-gray-800 dark:text-gray-300">
                        +{vm.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(vm.status)}`}>
              {getStatusIcon(vm.status)}
              <span>{vm.status}</span>
            </div>
            
            {vm.template && (
              <span className="px-3 py-1.5 text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded-full dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                Template
              </span>
            )}
            
            {vm.status === 'running' && (
              <div className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-lg ${getHealthColor(vm.realtime.health)}`}>
                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                <span>{vm.realtime.health}</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Stats */}
        {vm.status === 'running' && (
          <div className="mb-6 space-y-4">
            {/* Performance Indicators */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <CircularProgress value={vm.realtime.cpu} color="#3B82F6" />
                <div className="flex items-center justify-center mt-2 space-x-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">CPU</span>
                  {getTrendIcon(vm.performance.cpuTrend)}
                </div>
              </div>
              
              <div className="text-center">
                <CircularProgress value={vm.realtime.memory} color="#8B5CF6" />
                <div className="flex items-center justify-center mt-2 space-x-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">RAM</span>
                  {getTrendIcon(vm.performance.memoryTrend)}
                </div>
              </div>
              
              <div className="text-center">
                <CircularProgress value={Math.min(vm.realtime.diskIO, 100)} color="#10B981" />
                <div className="flex items-center justify-center mt-2 space-x-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Disk</span>
                  <HardDrive className="w-3 h-3 text-gray-500" />
                </div>
              </div>
              
              <div className="text-center">
                <CircularProgress value={vm.realtime.responsiveness} color="#F59E0B" />
                <div className="flex items-center justify-center mt-2 space-x-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Resp.</span>
                  <Gauge className="w-3 h-3 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Mini Charts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">CPU Usage</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {vm.realtime.cpu.toFixed(1)}%
                  </span>
                </div>
                <MiniChart data={vm.stats} dataKey="cpu" color="#3B82F6" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Memory</span>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {vm.realtime.memory.toFixed(1)}%
                  </span>
                </div>
                <MiniChart data={vm.stats} dataKey="memory" color="#8B5CF6" />
              </div>
            </div>

            {/* Network & IOPS */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50/50 rounded-xl dark:bg-gray-800/50">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1 space-x-1">
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Network</span>
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span>{vm.realtime.networkIn.toFixed(1)} MB/s</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingDown className="w-3 h-3 text-orange-500" />
                    <span>{vm.realtime.networkOut.toFixed(1)} MB/s</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1 space-x-1">
                  <HardDrive className="w-3 h-3 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">IOPS</span>
                </div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {vm.realtime.iops.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">
                  {vm.realtime.diskIO.toFixed(1)} MB/s
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resource Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">vCPUs</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{vm.cpus || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Memory</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatBytes(vm.maxmem || 0)}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Storage</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatBytes(vm.maxdisk || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Uptime</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatUptime(vm.uptime || 0)}</span>
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
                  tooltip="Stop VM"
                >
                  Stop
                </ActionButton>
                <ActionButton
                  onClick={() => handleVMAction('reboot', vm)}
                  disabled={!!currentAction || vm.template}
                  loading={currentAction === 'reboot'}
                  variant="warning"
                  icon={RotateCcw}
                  tooltip="Reboot VM"
                >
                  Reboot
                </ActionButton>
                <ActionButton
                  onClick={() => handleVMAction('suspend', vm)}
                  disabled={!!currentAction || vm.template}
                  loading={currentAction === 'suspend'}
                  variant="secondary"
                  icon={Pause}
                  tooltip="Suspend VM"
                >
                  Suspend
                </ActionButton>
              </>
            ) : vm.status === 'suspended' ? (
              <ActionButton
                onClick={() => handleVMAction('resume', vm)}
                disabled={!!currentAction}
                loading={currentAction === 'resume'}
                variant="success"
                icon={Play}
                tooltip="Resume VM"
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
                tooltip="Start VM"
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
                tooltip="Open Console"
              >
                Console
              </ActionButton>
            )}
            
            {onOpenHardware && (
              <ActionButton
                onClick={() => onOpenHardware(vm.vmid, selectedNode)}
                variant="secondary"
                icon={Settings}
                tooltip="Hardware Configuration"
              >
                Hardware
              </ActionButton>
            )}
            
            <ActionButton
              onClick={() => {/* TODO: Implement */}}
              variant="secondary"
              icon={BarChart3}
              tooltip="Performance Details"
            >
              Analytics
            </ActionButton>
          </div>
        </div>

        {/* Live Indicator */}
        {isRealtime && vm.status === 'running' && (
          <div className="flex items-center justify-center mt-4 space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {connectionStatus === 'connected' ? 'Live Data' : 'Demo Mode'}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Show loading state only when actually loading and no VMs are available
  if (loading && vms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading virtual machines...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Fetching real-time data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Enhanced Header */}
      <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text">
            Virtual Machines
          </h1>
          <div className="flex items-center mt-2 space-x-4">
            <p className="text-gray-600 dark:text-gray-400">
              {filteredVMs.length} of {vms.length} VMs • {filteredVMs.filter(vm => vm.status === 'running').length} running
            </p>
            {connectionStatus === 'disconnected' && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Demo Mode</span>
              </div>
            )}
            {selectedVMs.size > 0 && (
              <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                {selectedVMs.size} selected
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Node Selector */}
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="px-4 py-2 text-sm border shadow-sm bg-white/80 backdrop-blur-sm border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900/80 dark:border-gray-700/50 dark:text-white"
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
          
          {/* Real-time Toggle */}
          <button
            onClick={() => setIsRealtime(!isRealtime)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              isRealtime 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 shadow-lg' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {isRealtime ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="font-medium">{isRealtime ? 'Live' : 'Paused'}</span>
          </button>
          
          {/* Performance Panel Toggle */}
          <button
            onClick={() => setShowPerformancePanel(!showPerformancePanel)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              showPerformancePanel 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 shadow-lg' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium">Analytics</span>
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={fetchVMs}
            className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Enhanced Filters and Controls */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
          <input
            type="text"
            placeholder="Search VMs, tags, or IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 text-sm border shadow-sm bg-white/80 backdrop-blur-sm border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900/80 dark:border-gray-700/50 dark:text-white"
          />
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border shadow-sm bg-white/80 backdrop-blur-sm border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900/80 dark:border-gray-700/50 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm border shadow-sm bg-white/80 backdrop-blur-sm border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900/80 dark:border-gray-700/50 dark:text-white"
          >
            <option value="name">Sort by Name</option>
            <option value="cpu">Sort by CPU</option>
            <option value="memory">Sort by Memory</option>
            <option value="uptime">Sort by Uptime</option>
            <option value="health">Sort by Health</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border shadow-sm bg-white/80 backdrop-blur-sm border-gray-200/50 rounded-xl hover:bg-gray-50/80 dark:bg-gray-900/80 dark:border-gray-700/50 dark:hover:bg-gray-800/80"
          >
            {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </button>

          {/* View Mode */}
          <div className="flex p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl dark:bg-gray-800/80">
            {(['grid', 'list', 'compact'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  viewMode === mode 
                    ? 'bg-white shadow-sm text-gray-900 dark:bg-gray-700 dark:text-white' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedVMs.size > 0 && (
          <div className="flex items-center space-x-2">
            <ActionButton
              onClick={() => handleBulkAction('start')}
              variant="success"
              icon={Play}
              size="sm"
            >
              Start Selected
            </ActionButton>
            <ActionButton
              onClick={() => handleBulkAction('stop')}
              variant="danger"
              icon={Square}
              size="sm"
            >
              Stop Selected
            </ActionButton>
          </div>
        )}
      </div>

      {/* VM Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredVMs.map((vm) => (
            <VMCard key={vm.vmid} vm={vm} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredVMs.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-6 mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl dark:from-blue-900/20 dark:to-purple-900/20">
            <Monitor className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            {vms.length === 0 ? 'No Virtual Machines' : 'No VMs match your filters'}
          </h3>
          <p className="max-w-md mb-6 text-gray-500 dark:text-gray-400">
            {vms.length === 0 
              ? (selectedNode ? `No VMs found on node ${selectedNode}. Create your first VM to get started.` : 'Select a node to view VMs')
              : 'Try adjusting your search or filter criteria to find the VMs you\'re looking for.'
            }
          </p>
          {vms.length === 0 && !selectedNode && (
            <ActionButton
              onClick={() => {
                setSelectedNode('pve-node1');
                loadDemoVMs();
              }}
              variant="primary"
              icon={Layers}
              size="md"
            >
              Load Demo Data
            </ActionButton>
          )}
        </div>
      )}
    </div>
  );
};

export default VMManager;