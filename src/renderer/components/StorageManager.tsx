import React, { useEffect, useState } from 'react';
import { HardDrive, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useProxmox } from '../hooks/useProxmox';
import { ProxmoxStorage } from '../types/proxmox';

const StorageManager: React.FC = () => {
  const { nodes, getStorage } = useProxmox();
  const [storageData, setStorageData] = useState<{ [node: string]: ProxmoxStorage[] }>({});
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string>('');

  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0].node);
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    if (selectedNode) {
      fetchStorage();
    }
  }, [selectedNode]);

  const fetchStorage = async () => {
    if (!selectedNode) return;
    
    setLoading(true);
    try {
      const storage = await getStorage(selectedNode);
      setStorageData(prev => ({ ...prev, [selectedNode]: storage }));
    } catch (error) {
      console.error('Failed to fetch storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStorage = async () => {
    setLoading(true);
    try {
      const allStorage: { [node: string]: ProxmoxStorage[] } = {};
      for (const node of nodes) {
        const storage = await getStorage(node.node);
        allStorage[node.node] = storage;
      }
      setStorageData(allStorage);
    } catch (error) {
      console.error('Failed to fetch all storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'dir': '#3b82f6',
      'zfspool': '#10b981',
      'lvm': '#f59e0b',
      'lvm-thin': '#ef4444',
      'nfs': '#8b5cf6',
      'cephfs': '#06b6d4',
      'rbd': '#ec4899',
    };
    return colors[type] || '#6b7280';
  };

  const currentStorage = selectedNode ? storageData[selectedNode] || [] : [];
  
  const storageChartData = currentStorage.map(storage => ({
    name: storage.storage,
    used: storage.used || 0,
    available: storage.avail || 0,
    total: storage.total || 0,
    usedPercent: storage.total ? Math.round(((storage.used || 0) / storage.total) * 100) : 0,
  }));

  const pieChartData = currentStorage.map(storage => ({
    name: storage.storage,
    value: storage.used || 0,
    color: getStorageTypeColor(storage.type),
  }));

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Storage Management</h1>
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
            onClick={fetchStorage}
            disabled={!selectedNode}
            className="btn-primary"
          >
            Refresh Node
          </button>
          <button
            onClick={fetchAllStorage}
            className="btn-secondary"
          >
            Refresh All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Storage Overview Charts */}
          {currentStorage.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Usage by Volume</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={storageChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={formatBytes} />
                    <Tooltip 
                      formatter={(value, name) => [formatBytes(value as number), name]}
                      labelFormatter={(label) => `Storage: ${label}`}
                    />
                    <Bar dataKey="used" fill="#ef4444" name="Used" />
                    <Bar dataKey="available" fill="#10b981" name="Available" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatBytes(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatBytes(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Storage Details Table */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Storage Details {selectedNode && `- ${selectedNode}`}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Used / Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStorage.map((storage) => {
                    const usagePercent = storage.total ? Math.round(((storage.used || 0) / storage.total) * 100) : 0;
                    
                    return (
                      <tr key={storage.storage}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <HardDrive 
                              className="h-5 w-5 mr-3" 
                              style={{ color: getStorageTypeColor(storage.type) }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{storage.storage}</div>
                              {storage.shared && (
                                <div className="text-xs text-blue-600">Shared</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {storage.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {storage.content.split(',').slice(0, 2).join(', ')}
                          {storage.content.split(',').length > 2 && '...'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {storage.enabled ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                            )}
                            <span className={storage.enabled ? 'status-running' : 'status-stopped'}>
                              {storage.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatBytes(storage.used || 0)} / {formatBytes(storage.total || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  usagePercent > 80 ? 'bg-red-500' : 
                                  usagePercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-700">{usagePercent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {currentStorage.length === 0 && !loading && (
            <div className="text-center py-12">
              <HardDrive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Storage Found</h3>
              <p className="text-gray-500">
                {selectedNode ? `No storage configured on node ${selectedNode}` : 'Select a node to view storage'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StorageManager;