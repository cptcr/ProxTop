
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Database, 
  Play, 
  Square, 
  RotateCcw,
  Search,
  Filter,
  Settings, 
  AlertCircle,
  CheckCircle2,
  Pause,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useProxmox } from '../hooks/useProxmox';
import { ClusterResource, ProxmoxNode } from '../types/proxmox';

const ContainerManager: React.FC = () => {
  const { 
    nodes, 
    clusterResources,
    startContainer, 
    stopContainer, 
    loading,
    error,
    fetchNodes,
    fetchClusterResources
  } = useProxmox();
  
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped' | 'suspended'>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Get containers from cluster resources
  const containers = clusterResources.filter((resource: ClusterResource) => 
    resource.type === 'lxc' && 
    (selectedNode === '' || resource.node === selectedNode)
  );

  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0].node);
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      await Promise.all([
        fetchNodes(),
        fetchClusterResources()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh container data:', error);
    }
  }, [fetchNodes, fetchClusterResources]);

  const handleContainerAction = async (action: string, ctId: number, nodeId: string) => {
    const ctKey = `${nodeId}-${ctId}`;
    setActionLoading(prev => ({ ...prev, [ctKey]: action }));

    try {
      switch (action) {
        case 'start':
          await startContainer(nodeId, ctId.toString());
          break;
        case 'stop':
          await stopContainer(nodeId, ctId.toString());
          break;
      }
      
      // Refresh data after action
      setTimeout(refreshData, 2000);
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[ctKey];
        return newState;
      });
    }
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
        return 'status-running';
      case 'stopped':
        return 'status-stopped';
      case 'suspended':
        return 'status-paused';
      default:
        return 'status-unknown';
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
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Filter containers based on search and status
  const filteredContainers = containers.filter((container: ClusterResource) => {
    const matchesSearch = searchTerm === '' || 
      container.vmid?.toString().includes(searchTerm) ||
      container.node?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || container.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading && containers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 rounded-full border-t-blue-600 animate-spin"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading containers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Error Loading Containers</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <button onClick={refreshData} className="btn-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            LXC Containers
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredContainers.length} containers • {filteredContainers.filter((ct: ClusterResource) => ct.status === 'running').length} running
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button onClick={refreshData} className="btn-secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
        {/* Node Filter */}
        <select
          value={selectedNode}
          onChange={(e) => setSelectedNode(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Nodes</option>
          {nodes.map((node: ProxmoxNode) => (
            <option key={node.node} value={node.node}>
              {node.node}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Search containers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Container Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredContainers.map((container: ClusterResource) => {
          const ctKey = `${container.node}-${container.vmid}`;
          const currentAction = actionLoading[ctKey];
          
          return (
            <div key={`${container.node}-${container.vmid}`} className="card">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                    <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      CT {container.vmid}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Node: {container.node}
                    </p>
                  </div>
                </div>
                
                <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(container.status)}`}>
                  {getStatusIcon(container.status)}
                  <span>{container.status}</span>
                </span>
              </div>

              {/* Resource Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">CPU:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {container.maxcpu || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Memory:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {container.maxmem ? formatBytes(container.maxmem) : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Disk:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {container.maxdisk ? formatBytes(container.maxdisk) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Usage:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {container.cpu ? `${(container.cpu * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Status Details */}
              {container.status === 'running' && (
                <div className="p-3 mb-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 dark:text-green-400">CPU:</span>
                      <span className="font-medium text-green-800 dark:text-green-300">
                        {container.cpu ? `${(container.cpu * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 dark:text-green-400">Memory:</span>
                      <span className="font-medium text-green-800 dark:text-green-300">
                        {container.mem && container.maxmem ? `${((container.mem / container.maxmem) * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Primary Actions */}
                <div className="flex space-x-2">
                  {container.status === 'running' ? (
                    <button
                      onClick={() => handleContainerAction('stop', container.vmid!, container.node!)}
                      disabled={!!currentAction}
                      className="flex items-center flex-1 space-x-1 btn-danger"
                    >
                      {currentAction === 'stop' ? (
                        <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleContainerAction('start', container.vmid!, container.node!)}
                      disabled={!!currentAction}
                      className="flex items-center flex-1 space-x-1 btn-success"
                    >
                      {currentAction === 'start' ? (
                        <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      <span>Start</span>
                    </button>
                  )}
                  
                  <button className="p-2 btn-secondary">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredContainers.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {containers.length === 0 ? 'No Containers' : 'No containers match your filters'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {containers.length === 0 
              ? (selectedNode ? `No containers found on node ${selectedNode}` : 'No containers found in cluster')
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ContainerManager;