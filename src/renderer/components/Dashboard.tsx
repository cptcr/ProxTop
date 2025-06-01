// src/renderer/components/Dashboard.tsx - Fixed with proper types
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Server,
  Monitor,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useProxmox } from '../hooks/useProxmox';
import { ProxmoxNode, ClusterResource } from '../types/proxmox';

interface ClusterStats {
  totalNodes: number;
  onlineNodes: number;
  totalVMs: number;
  runningVMs: number;
  totalContainers: number;
  runningContainers: number;
  totalMemory: number;
  usedMemory: number;
  totalStorage: number;
  usedStorage: number;
  averageCPU: number;
}

interface NodeMetrics {
  timestamp: number;
  node: string;
  cpu: number;
  memory: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsage: number;
  uptime: number;
  vms: number;
  containers: number;
}

const Dashboard: React.FC = () => {
  const { 
    nodes, 
    clusterResources, 
    loading, 
    error, 
    fetchNodes, 
    fetchClusterResources,
    getUserInfo
  } = useProxmox();
  
  const [clusterStats, setClusterStats] = useState<ClusterStats | null>(null);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize and fetch data
  useEffect(() => {
    initializeDashboard();
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const initializeDashboard = async () => {
    try {
      const info = await getUserInfo();
      setUserInfo(info);
      await refreshData();
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    }
  };

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchNodes(),
        fetchClusterResources()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchNodes, fetchClusterResources]);

  // Calculate cluster statistics from real data
  useEffect(() => {
    if (nodes.length === 0 || clusterResources.length === 0) return;

    const vms = clusterResources.filter((r: ClusterResource) => r.type === 'vm');
    const containers = clusterResources.filter((r: ClusterResource) => r.type === 'lxc');
    const onlineNodes = nodes.filter((n: ProxmoxNode) => n.status === 'online');

    const stats: ClusterStats = {
      totalNodes: nodes.length,
      onlineNodes: onlineNodes.length,
      totalVMs: vms.length,
      runningVMs: vms.filter((vm: ClusterResource) => vm.status === 'running').length,
      totalContainers: containers.length,
      runningContainers: containers.filter((ct: ClusterResource) => ct.status === 'running').length,
      totalMemory: nodes.reduce((sum: number, node: ProxmoxNode) => sum + (node.maxmem || 0), 0),
      usedMemory: nodes.reduce((sum: number, node: ProxmoxNode) => sum + (node.mem || 0), 0),
      totalStorage: nodes.reduce((sum: number, node: ProxmoxNode) => sum + (node.maxdisk || 0), 0),
      usedStorage: nodes.reduce((sum: number, node: ProxmoxNode) => sum + (node.disk || 0), 0),
      averageCPU: nodes.length > 0 
        ? nodes.reduce((sum: number, node: ProxmoxNode) => sum + ((node.cpu || 0) * 100), 0) / nodes.length 
        : 0
    };

    setClusterStats(stats);

    // Create node metrics for charts
    const metrics: NodeMetrics[] = nodes.map((node: ProxmoxNode) => {
      const nodeVMs = vms.filter((vm: ClusterResource) => vm.node === node.node);
      const nodeContainers = containers.filter((ct: ClusterResource) => ct.node === node.node);

      return {
        timestamp: Date.now(),
        node: node.node,
        cpu: (node.cpu || 0) * 100,
        memory: node.maxmem ? ((node.mem || 0) / node.maxmem) * 100 : 0,
        memoryUsed: node.mem || 0,
        memoryTotal: node.maxmem || 0,
        diskUsage: node.maxdisk ? ((node.disk || 0) / node.maxdisk) * 100 : 0,
        uptime: node.uptime || 0,
        vms: nodeVMs.length,
        containers: nodeContainers.length
      };
    });

    setNodeMetrics(metrics);
  }, [nodes, clusterResources]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  if (loading && !clusterStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 rounded-full border-t-blue-600 animate-spin"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading cluster data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Error Loading Data</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <button onClick={refreshData} className="btn-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!clusterStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Server className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No Cluster Data</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Connect to a Proxmox cluster to view dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cluster Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {userInfo?.userid && `Welcome back, ${userInfo.userid.split('@')[0]}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Cluster Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Nodes */}
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900">
              <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nodes</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {clusterStats.onlineNodes}/{clusterStats.totalNodes}
                </p>
                {clusterStats.onlineNodes === clusterStats.totalNodes ? (
                  <CheckCircle2 className="w-5 h-5 ml-2 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 ml-2 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VMs */}
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg dark:bg-green-900">
              <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Virtual Machines</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {clusterStats.runningVMs}/{clusterStats.totalVMs}
              </p>
            </div>
          </div>
        </div>

        {/* Containers */}
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-900">
              <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Containers</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {clusterStats.runningContainers}/{clusterStats.totalContainers}
              </p>
            </div>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg dark:bg-orange-900">
              <Cpu className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average CPU</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {clusterStats.averageCPU.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Memory Usage */}
        <div className="card">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Memory Usage</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatBytes(clusterStats.usedMemory)} / {formatBytes(clusterStats.totalMemory)}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {((clusterStats.usedMemory / clusterStats.totalMemory) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
              <div 
                className="h-2 transition-all duration-1000 bg-purple-600 rounded-full"
                style={{ width: `${(clusterStats.usedMemory / clusterStats.totalMemory) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="card">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Storage Usage</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatBytes(clusterStats.usedStorage)} / {formatBytes(clusterStats.totalStorage)}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {((clusterStats.usedStorage / clusterStats.totalStorage) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
              <div 
                className="h-2 transition-all duration-1000 bg-blue-600 rounded-full"
                style={{ width: `${(clusterStats.usedStorage / clusterStats.totalStorage) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Node Resource Chart */}
      <div className="card">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Node Resource Usage</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={nodeMetrics}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="node" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any, name: string) => [
                name === 'cpu' || name === 'memory' || name === 'diskUsage' 
                  ? `${value.toFixed(1)}%` 
                  : value,
                name === 'cpu' ? 'CPU' : 
                name === 'memory' ? 'Memory' : 
                name === 'diskUsage' ? 'Disk' : name
              ]}
            />
            <Bar dataKey="cpu" fill="#3b82f6" name="cpu" />
            <Bar dataKey="memory" fill="#8b5cf6" name="memory" />
            <Bar dataKey="diskUsage" fill="#10b981" name="diskUsage" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Node Status Table */}
      <div className="card">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Node Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Node
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  CPU
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Memory
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  VMs/CTs
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Uptime
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {nodeMetrics.map((node: NodeMetrics) => (
                <tr key={node.node} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {node.node}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="status-running">
                      online
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                    {node.cpu.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                    {node.memory.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                    {node.vms}/{node.containers}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                    {formatUptime(node.uptime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;