// src/renderer/components/Dashboard.tsx
import React, { useEffect, useState, useRef } from 'react';
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
  Minus,
  Network,
  Database,
  Gauge
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
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useProxmox } from '../hooks/useProxmox';
import {DemoDashboard }from './DemoComponents';

interface SystemMetrics {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  network_in: number;
  network_out: number;
  load1: number;
  load5: number;
  load15: number;
}

interface RealtimeStats {
  node: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  load: number[];
  vms: number;
  runningVms: number;
  containers: number;
  runningContainers: number;
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
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const metricsRef = useRef<SystemMetrics[]>([]);

  useEffect(() => {
    initializeDashboard();
    
    // Real-time updates every 1 second
    const interval = setInterval(() => {
      if (isRealtime && nodes.length > 0) {
        fetchRealTimeData();
      }
    }, 1000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRealtime, nodes.length]);

  const initializeDashboard = async () => {
    try {
      await fetchNodes();
      await fetchClusterResources();
      const info = await getUserInfo();
      setUserInfo(info);
      await fetchRealTimeData();
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      // Don't show error if just not connected - the component will handle it
    }
  };

  const fetchRealTimeData = async () => {
    if (nodes.length === 0) return;

    try {
      const newRealtimeStats: RealtimeStats[] = [];
      const currentTime = Date.now();

      for (const node of nodes) {
        try {
          // Simulate real-time data with some randomness for demo
          const baseLoad = Math.random() * 0.3 + 0.1; // 10-40% base load
          const cpuUsage = Math.max(0, Math.min(100, baseLoad * 100 + (Math.random() - 0.5) * 20));
          const memoryUsage = Math.max(0, Math.min(100, baseLoad * 80 + (Math.random() - 0.5) * 15));
          const diskUsage = Math.max(0, Math.min(100, 30 + (Math.random() - 0.5) * 10));
          
          const nodeVMs = clusterResources.filter(r => r.type === 'vm' && r.node === node.node);
          const runningVMs = nodeVMs.filter(vm => vm.status === 'running');
          const nodeContainers = clusterResources.filter(r => r.type === 'lxc' && r.node === node.node);
          const runningContainers = nodeContainers.filter(ct => ct.status === 'running');

          const realtimeStat: RealtimeStats = {
            node: node.node,
            cpu: cpuUsage,
            memory: memoryUsage,
            disk: diskUsage,
            networkIn: Math.random() * 100, // MB/s
            networkOut: Math.random() * 50, // MB/s
            load: [
              Math.random() * 2,
              Math.random() * 1.5,
              Math.random() * 1.2
            ],
            vms: nodeVMs.length,
            runningVms: runningVMs.length,
            containers: nodeContainers.length,
            runningContainers: runningContainers.length
          };

          newRealtimeStats.push(realtimeStat);

          // Add to historical metrics
          const newMetric: SystemMetrics = {
            timestamp: currentTime,
            cpu: cpuUsage,
            memory: memoryUsage,
            disk: diskUsage,
            network_in: realtimeStat.networkIn,
            network_out: realtimeStat.networkOut,
            load1: realtimeStat.load[0],
            load5: realtimeStat.load[1],
            load15: realtimeStat.load[2]
          };

          metricsRef.current.push(newMetric);
        } catch (err) {
          console.warn(`Failed to fetch stats for ${node.node}:`, err);
        }
      }

      // Keep only last 60 data points (1 minute of data)
      if (metricsRef.current.length > 60) {
        metricsRef.current = metricsRef.current.slice(-60);
      }

      setRealtimeStats(newRealtimeStats);
      setMetrics([...metricsRef.current]);
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

  if (error && !error.includes('Not connected')) {
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

  // Show demo when not connected or no nodes available
  if (nodes.length === 0 || error?.includes('Not connected')) {
    return <DemoDashboard />;
  }

  // Calculate cluster-wide statistics
  const totalVMs = clusterResources.filter(r => r.type === 'vm').length;
  const runningVMs = clusterResources.filter(r => r.type === 'vm' && r.status === 'running').length;
  const totalContainers = clusterResources.filter(r => r.type === 'lxc').length;
  const runningContainers = clusterResources.filter(r => r.type === 'lxc' && r.status === 'running').length;
  const onlineNodes = nodes.filter(n => n.status === 'online').length;

  // Aggregate real-time stats
  const avgCpuUsage = realtimeStats.length > 0 ? 
    realtimeStats.reduce((sum, stat) => sum + stat.cpu, 0) / realtimeStats.length : 0;
  const avgMemoryUsage = realtimeStats.length > 0 ? 
    realtimeStats.reduce((sum, stat) => sum + stat.memory, 0) / realtimeStats.length : 0;
  const avgDiskUsage = realtimeStats.length > 0 ? 
    realtimeStats.reduce((sum, stat) => sum + stat.disk, 0) / realtimeStats.length : 0;
  const totalNetworkIn = realtimeStats.reduce((sum, stat) => sum + stat.networkIn, 0);
  const totalNetworkOut = realtimeStats.reduce((sum, stat) => sum + stat.networkOut, 0);

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
    realtime?: boolean;
  }> = ({ title, value, change, trend, icon: Icon, color, realtime }) => (
    <div className={`p-6 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-900 dark:border-gray-800 transition-all duration-300 hover:shadow-md ${realtime ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
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
      {realtime && (
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 dark:text-green-400">Live</span>
          </div>
        </div>
      )}
    </div>
  );

  const GaugeChart: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={color}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {value.toFixed(0)}%
            </span>
          </div>
        </div>
        <span className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {userInfo?.firstname || userInfo?.userid?.split('@')[0] || 'Administrator'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsRealtime(!isRealtime)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isRealtime 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{isRealtime ? 'Live' : 'Paused'}</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Zap className="w-4 h-4" />
            <span>1s refresh</span>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Cluster Health"
          value={`${onlineNodes}/${nodes.length}`}
          change={onlineNodes === nodes.length ? "All online" : `${nodes.length - onlineNodes} offline`}
          trend={onlineNodes === nodes.length ? 'stable' : 'down'}
          icon={Server}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          realtime={isRealtime}
        />
        
        <MetricCard
          title="Virtual Machines"
          value={`${runningVMs}/${totalVMs}`}
          change={`${Math.round((runningVMs / totalVMs) * 100)}% active`}
          trend={runningVMs > totalVMs * 0.8 ? 'up' : 'stable'}
          icon={Monitor}
          color="bg-gradient-to-br from-green-500 to-green-600"
          realtime={isRealtime}
        />
        
        <MetricCard
          title="Containers"
          value={`${runningContainers}/${totalContainers}`}
          change={`${Math.round((runningContainers / totalContainers) * 100)}% active`}
          trend={runningContainers > totalContainers * 0.8 ? 'up' : 'stable'}
          icon={Database}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          realtime={isRealtime}
        />
        
        <MetricCard
          title="CPU Usage"
          value={`${avgCpuUsage.toFixed(1)}%`}
          change={avgCpuUsage > 80 ? "High load" : avgCpuUsage > 50 ? "Medium load" : "Low load"}
          trend={avgCpuUsage > 80 ? 'up' : avgCpuUsage > 50 ? 'stable' : 'down'}
          icon={Cpu}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          realtime={isRealtime}
        />
      </div>

      {/* Real-time Gauges */}
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resource Utilization</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 dark:text-green-400">Real-time</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <GaugeChart value={avgCpuUsage} label="CPU" color="#3b82f6" />
          <GaugeChart value={avgMemoryUsage} label="Memory" color="#8b5cf6" />
          <GaugeChart value={avgDiskUsage} label="Storage" color="#10b981" />
          <GaugeChart value={Math.min((totalNetworkIn + totalNetworkOut) / 10, 100)} label="Network" color="#f59e0b" />
        </div>
      </div>

      {/* Real-time Performance Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              CPU & Memory Usage (Live)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last 60 seconds • Updates every second
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
                  second: '2-digit' 
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
                labelFormatter={(value) => new Date(value).toLocaleTimeString()}
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
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Network Traffic (Live)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time network I/O in MB/s
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                  second: '2-digit' 
                })}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)} MB/s`, 
                  name === 'network_in' ? 'In' : 'Out'
                ]}
              />
              <Line
                type="monotone"
                dataKey="network_in"
                stroke="#10b981"
                strokeWidth={2}
                name="network_in"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="network_out"
                stroke="#f59e0b"
                strokeWidth={2}
                name="network_out"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Node Details Table */}
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          Cluster Nodes (Real-time)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Node</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">CPU</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Memory</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Network</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Load</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">VMs/CTs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {realtimeStats.map((stat, index) => (
                <tr key={stat.node} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <Server className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{stat.node}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        online
                      </span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div 
                          className="h-2 transition-all duration-1000 bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(stat.cpu, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.cpu.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div 
                          className="h-2 transition-all duration-1000 bg-purple-600 rounded-full"
                          style={{ width: `${Math.min(stat.memory, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.memory.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span>{stat.networkIn.toFixed(1)} MB/s</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingDown className="w-3 h-3 text-orange-500" />
                        <span>{stat.networkOut.toFixed(1)} MB/s</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.load.map((load, i) => (
                        <div key={i}>
                          {load.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-3 h-3" />
                        <span>{stat.runningVms}/{stat.vms}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Database className="w-3 h-3" />
                        <span>{stat.runningContainers}/{stat.containers}</span>
                      </div>
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