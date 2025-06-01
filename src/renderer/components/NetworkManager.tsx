import React, { useEffect, useState } from 'react';
import { Network, Wifi, Globe, Shield, Activity } from 'lucide-react';
import { useProxmox } from '../hooks/useProxmox';

interface NetworkInterface {
  iface: string;
  type: string;
  active: boolean;
  address?: string;
  netmask?: string;
  gateway?: string;
  bridge_ports?: string;
  bridge_stp?: string;
  bridge_fd?: string;
  autostart?: boolean;
}

const NetworkManager: React.FC = () => {
  const { nodes } = useProxmox();
  const [networks, setNetworks] = useState<{ [node: string]: NetworkInterface[] }>({});
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string>('');

  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0].node);
    }
  }, [nodes, selectedNode]);

  const fetchNetworkConfig = async (nodeId: string) => {
    // Mock network data since Proxmox network API would require additional implementation
    const mockNetworks: NetworkInterface[] = [
      {
        iface: 'vmbr0',
        type: 'bridge',
        active: true,
        address: '192.168.1.100',
        netmask: '255.255.255.0',
        gateway: '192.168.1.1',
        bridge_ports: 'eth0',
        bridge_stp: 'off',
        bridge_fd: '0',
        autostart: true,
      },
      {
        iface: 'vmbr1',
        type: 'bridge',
        active: true,
        address: '10.0.0.1',
        netmask: '255.255.255.0',
        bridge_ports: 'none',
        bridge_stp: 'off',
        bridge_fd: '0',
        autostart: true,
      },
      {
        iface: 'eth0',
        type: 'eth',
        active: true,
        autostart: true,
      },
      {
        iface: 'eth1',
        type: 'eth',
        active: false,
        autostart: false,
      }
    ];
    
    setNetworks(prev => ({ ...prev, [nodeId]: mockNetworks }));
  };

  useEffect(() => {
    if (selectedNode) {
      setLoading(true);
      fetchNetworkConfig(selectedNode).finally(() => setLoading(false));
    }
  }, [selectedNode]);

  const getInterfaceIcon = (type: string) => {
    switch (type) {
      case 'bridge':
        return Network;
      case 'eth':
        return Wifi;
      case 'bond':
        return Shield;
      default:
        return Globe;
    }
  };

  const getInterfaceColor = (type: string, active: boolean) => {
    if (!active) return 'text-gray-400';
    
    switch (type) {
      case 'bridge':
        return 'text-blue-600';
      case 'eth':
        return 'text-green-600';
      case 'bond':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const currentNetworks = selectedNode ? networks[selectedNode] || [] : [];

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Network Management</h1>
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
            onClick={() => selectedNode && fetchNetworkConfig(selectedNode)}
            disabled={!selectedNode}
            className="btn-primary"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Network Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Network className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Bridges</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentNetworks.filter(n => n.type === 'bridge').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wifi className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Physical Interfaces</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentNetworks.filter(n => n.type === 'eth').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Interfaces</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentNetworks.filter(n => n.active).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Network Interfaces */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Network Interfaces {selectedNode && `- ${selectedNode}`}
            </h3>
            <div className="space-y-4">
              {currentNetworks.map((interface_, index) => {
                const Icon = getInterfaceIcon(interface_.type);
                const iconColor = getInterfaceColor(interface_.type, interface_.active);
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Icon className={`h-8 w-8 mr-3 ${iconColor}`} />
                        <div>
                          <h4 className="font-medium text-gray-900">{interface_.iface}</h4>
                          <p className="text-sm text-gray-500 capitalize">{interface_.type} Interface</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={interface_.active ? 'status-running' : 'status-stopped'}>
                          {interface_.active ? 'Active' : 'Inactive'}
                        </span>
                        {interface_.autostart && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Auto-start
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {interface_.address && (
                        <div>
                          <p className="text-sm text-gray-500">IP Address</p>
                          <p className="font-medium">{interface_.address}</p>
                        </div>
                      )}
                      {interface_.netmask && (
                        <div>
                          <p className="text-sm text-gray-500">Netmask</p>
                          <p className="font-medium">{interface_.netmask}</p>
                        </div>
                      )}
                      {interface_.gateway && (
                        <div>
                          <p className="text-sm text-gray-500">Gateway</p>
                          <p className="font-medium">{interface_.gateway}</p>
                        </div>
                      )}
                      {interface_.bridge_ports && (
                        <div>
                          <p className="text-sm text-gray-500">Bridge Ports</p>
                          <p className="font-medium">{interface_.bridge_ports}</p>
                        </div>
                      )}
                      {interface_.bridge_stp && (
                        <div>
                          <p className="text-sm text-gray-500">STP</p>
                          <p className="font-medium">{interface_.bridge_stp}</p>
                        </div>
                      )}
                      {interface_.bridge_fd && (
                        <div>
                          <p className="text-sm text-gray-500">Forward Delay</p>
                          <p className="font-medium">{interface_.bridge_fd}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button className="btn-secondary">Edit</button>
                      <button className="btn-secondary">Configure</button>
                      {!interface_.active && (
                        <button className="btn-success">Activate</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentNetworks.length === 0 && !loading && (
            <div className="text-center py-12">
              <Network className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Network Interfaces</h3>
              <p className="text-gray-500">
                {selectedNode ? `No network interfaces found on node ${selectedNode}` : 'Select a node to view network configuration'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkManager;