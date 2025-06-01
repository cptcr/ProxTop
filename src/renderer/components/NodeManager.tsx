import React, { useEffect, useState } from 'react';
import { Server, Monitor, HardDrive, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useProxmox } from '../hooks/useProxmox';

const Dashboard: React.FC = () => {
  const { nodes, clusterResources, loading, error, fetchNodes, fetchClusterResources } = useProxmox();
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchNodes();
    fetchClusterResources();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNodes();
      fetchClusterResources();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchNodes, fetchClusterResources]);

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const totalVMs = clusterResources.filter(r => r.type === 'vm').length;
  const runningVMs = clusterResources.filter(r => r.type === 'vm' && r.status === 'running').length;
  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter(n => n.status === 'online').length;

  const nodeData = nodes.map(node => ({
    name: node.node,
    cpu: Math.round((node.cpu || 0) * 100),
    memory: Math.round(((node.mem || 0) / (node.maxmem || 1)) * 100),
    disk: Math.round(((node.disk || 0) / (node.maxdisk || 1)) * 100),
  }));

  const vmStatusData = [
    { name: 'Running', value: runningVMs, color: '#10b981' },
    { name: 'Stopped', value: totalVMs - runningVMs, color: '#ef4444' },
  ];

  const totalMemory = nodes.reduce((sum, node) => sum + (node.maxmem || 0), 0);
  const usedMemory = nodes.reduce((sum, node) => sum + (node.mem || 0), 0);
  const totalDisk = nodes.reduce((sum, node) => sum + (node.maxdisk || 0), 0);
  const usedDisk = nodes.reduce((sum, node) => sum + (node.disk || 0), 0);

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Auto-refresh: 30s</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Nodes</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900">{onlineNodes}/{totalNodes}</p>
                {onlineNodes === totalNodes ? (
                  <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="ml-2 h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Monitor className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Virtual Machines</p>
              <p className="text-2xl font-semibold text-gray-900">{runningVMs}/{totalVMs}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Memory Usage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round((usedMemory / totalMemory) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Storage Usage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round((usedDisk / totalDisk) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Node Resource Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nodeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="cpu" fill="#3b82f6" name="CPU" />
              <Bar dataKey="memory" fill="#10b981" name="Memory" />
              <Bar dataKey="disk" fill="#f59e0b" name="Disk" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">VM Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vmStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {vmStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Node Status Table */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Node Status</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Node
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPU Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Memory Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uptime
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {nodes.map((node) => (
                <tr key={node.node}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {node.node}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={node.status === 'online' ? 'status-running' : 'status-stopped'}>
                      {node.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round((node.cpu || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(((node.mem || 0) / (node.maxmem || 1)) * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.floor((node.uptime || 0) / 86400)}d {Math.floor(((node.uptime || 0) % 86400) / 3600)}h
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