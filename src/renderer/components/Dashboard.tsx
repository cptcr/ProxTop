// src/renderer/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Monitor, 
  Server, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useProxmox } from '../hooks/useProxmox';

interface SystemMetrics {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  network_in: number;
  network_out: number;
}

const Dashboard: React.FC = () => {
  const { 
    nodes, 
    clusterResources, 
    loading, 
    error, 
    fetchNodes, 
    fetchClusterResources,
    getUserInfo,
    getNodeStats
  } = useProxmox();
  
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeDashboard();
    
    const interval = setInterval(() => {
      fetchRealTimeData();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const initializeDashboard = async () => {
    await fetchNodes();
    await fetchClusterResources();
    const info = await getUserInfo();
    setUserInfo(info);
    await fetchRealTimeData();
  };

  const fetchRealTimeData = async () => {
    if (nodes.length === 0) return;

    try {
      const nodeMetrics = await Promise.all(
        nodes.map(async (node) => {
          try {
            const stats = await getNodeStats(node.node, 'hour');
            return stats;
          } catch (err) {
            console.warn(`Failed to fetch stats for ${node.node}:`, err);
            return null;
          }
        })
      );

      // Process real metrics data
      const processedMetrics = nodeMetrics
        .filter(Boolean)
        .flatMap(nodeData => 
          nodeData?.map((point: any) => ({
            timestamp: point.time * 1000,
            cpu: (point.cpu || 0) * 100,
            memory: ((point.memused || 0) / (point.memtotal || 1)) * 100,
            disk: ((point.used || 0) / (point.total || 1)) * 100,
            network_in: (point.netin || 0) / 1024 / 1024, // Convert to MB/s
            network_out: (point.netout || 0) / 1024 / 1024
          })) || []
        )
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-24); // Last 24 data points

      setMetrics(processedMetrics);
    } catch (error) {
      console.error('Failed to fetch real-time data:', error);
    }
  };

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading cluster data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connection Error</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate real cluster statistics
  const totalVMs = clusterResources.filter(r => r.type === 'qemu').length;
  const runningVMs = clusterResources.filter(r => r.type === 'qemu' && r.status === 'running').length;
  const totalContainers = clusterResources.filter(r => r.type === 'lxc').length;
  const runningContainers = clusterResources.filter(r => r.type === 'lxc' && r.status === 'running').length;
  const onlineNodes = nodes.filter(n => n.status === 'online').length;

  // Aggregate resource usage
  const totalMemory = nodes.reduce((sum, node) => sum + (node.maxmem || 0), 0);
  const usedMemory = nodes.reduce((sum, node) => sum + (node.mem || 0), 0);
  const totalDisk = nodes.reduce((sum, node) => sum + (node.maxdisk || 0), 0);
  const usedDisk = nodes.reduce((sum, node) => sum + (node.disk || 0), 0);
  const avgCpuUsage = nodes.length > 0 ? 
    nodes.reduce((sum, node) => sum + ((node.cpu || 0) * 100), 0) / nodes.length : 0;

  const memoryUsagePercent = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;
  const diskUsagePercent = totalDisk > 0 ? (usedDisk / totalDisk) * 100 : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'stable';
    icon: React.ComponentType<any>;
    color: string;
  }> = ({ title, value, change, trend, icon: Icon, color }) => (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
        {change && (
          <div className="flex items-center space-x-1">
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-gray-500" />}
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {userInfo?.firstname || userInfo?.userid?.split('@')[0] || 'Administrator'}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Activity className="w-4 h-4" />
          <span>Live data • 30s refresh</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Cluster Health"
          value={`${onlineNodes}/${nodes.length}`}
          change={onlineNodes === nodes.length ? "All online" : `${nodes.length - onlineNodes} offline`}
          trend={onlineNodes === nodes.length ? 'stable' : 'down'}
          icon={Server}
          color="bg-blue-600"
        />
        
        <MetricCard
          title="Virtual Machines"
          value={`${runningVMs}/${totalVMs}`}
          change={`${totalVMs - runningVMs} stopped`}
          trend={runningVMs > totalVMs * 0.8 ? 'up' : 'stable'}
          icon={Monitor}
          color="bg-green-600"
        />
        
        <MetricCard
          title="Containers"
          value={`${runningContainers}/${totalContainers}`}
          change={`${totalContainers - runningContainers} stopped`}
          trend={runningContainers > totalContainers * 0.8 ? 'up' : 'stable'}
          icon={Activity}
          color="bg-purple-600"
        />
        
        <MetricCard
          title="CPU Usage"
          value={`${avgCpuUsage.toFixed(1)}%`}
          change={avgCpuUsage > 80 ? "High load" : avgCpuUsage > 50 ? "Medium load" : "Low load"}
          trend={avgCpuUsage > 80 ? 'up' : avgCpuUsage > 50 ? 'stable' : 'down'}
          icon={Cpu}
          color="bg-orange-600"
        />
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Memory Usage</h3>
            <MemoryStick className="w-5 h-5 text-purple-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Used</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatBytes(usedMemory)}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full dark:bg-gray-700">
              <div 
                className="h-3 transition-all duration-300 bg-purple-600 rounded-full"
                style={{ width: `${Math.min(memoryUsagePercent, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatBytes(totalMemory)}
              </span>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {memoryUsagePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Storage Usage</h3>
            <HardDrive className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Used</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatBytes(usedDisk)}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full dark:bg-gray-700">
              <div 
                className="h-3 transition-all duration-300 bg-green-600 rounded-full"
                style={{ width: `${Math.min(diskUsagePercent, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatBytes(totalDisk)}
              </span>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {diskUsagePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      {metrics.length > 0 && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Metrics (Last Hour)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time cluster performance data
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)}%`, 
                  name === 'cpu' ? 'CPU' : name === 'memory' ? 'Memory' : 'Disk'
                ]}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#3b82f6"
                fill="url(#cpuGradient)"
                strokeWidth={2}
                name="cpu"
              />
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#8b5cf6"
                fill="url(#memGradient)"
                strokeWidth={2}
                name="memory"
              />
              <Line
                type="monotone"
                dataKey="disk"
                stroke="#10b981"
                strokeWidth={2}
                name="disk"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cluster Status Table */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          Cluster Nodes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Node</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">CPU</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Memory</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {nodes.map((node) => (
                <tr key={node.node} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <Server className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{node.node}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {node.status === 'online' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        node.status === 'online' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {node.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div 
                          className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(((node.cpu || 0) * 100), 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {((node.cpu || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div 
                          className="h-2 transition-all duration-300 bg-purple-600 rounded-full"
                          style={{ width: `${Math.min(((node.mem || 0) / (node.maxmem || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {(((node.mem || 0) / (node.maxmem || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatUptime(node.uptime || 0)}
                      </span>
                    </div>
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