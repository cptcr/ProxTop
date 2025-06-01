import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Network, 
  Monitor, 
  Disc, 
  Settings, 
  Save, 
  Plus, 
  Trash2,
  MemoryStick as Memory,
  Usb
} from 'lucide-react';

interface VMHardwareConfig {
  vmid: number;
  name: string;
  node: string;
  cores: number;
  sockets: number;
  memory: number;
  balloon: number;
  numa: boolean;
  cpu: string;
  machine: string;
  bios: string;
  disks: VMDisk[];
  networks: VMNetwork[];
  cdrom?: string;
  boot: string;
  onboot: boolean;
  protection: boolean;
  tablet: boolean;
  usb: VMUsb[];
  args?: string;
}

interface VMDisk {
  id: string;
  storage: string;
  size: string;
  format: string;
  cache: string;
  backup: boolean;
  replicate: boolean;
  ssd: boolean;
  iothread: boolean;
}

interface VMNetwork {
  id: string;
  bridge: string;
  model: string;
  macaddr: string;
  firewall: boolean;
  linkdown: boolean;
  rate?: number;
  tag?: number;
}

interface VMUsb {
  id: string;
  host: string;
  usb3: boolean;
}

interface VMHardwareManagerProps {
  vmId: number;
  nodeId: string;
  onClose: () => void;
}

const VMHardwareManager: React.FC<VMHardwareManagerProps> = ({ vmId, nodeId, onClose }) => {
  const [config, setConfig] = useState<VMHardwareConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'cpu' | 'memory' | 'disks' | 'network' | 'options'>('general');

  useEffect(() => {
    fetchVMConfig();
  }, [vmId, nodeId]);

  const fetchVMConfig = async () => {
    setLoading(true);
    try {
      // Mock VM configuration - in real implementation, this would fetch from Proxmox API
      const mockConfig: VMHardwareConfig = {
        vmid: vmId,
        name: `VM-${vmId}`,
        node: nodeId,
        cores: 2,
        sockets: 1,
        memory: 2048,
        balloon: 2048,
        numa: false,
        cpu: 'host',
        machine: 'q35',
        bios: 'seabios',
        disks: [
          {
            id: 'scsi0',
            storage: 'local-lvm',
            size: '32G',
            format: 'raw',
            cache: 'none',
            backup: true,
            replicate: true,
            ssd: false,
            iothread: false,
          },
        ],
        networks: [
          {
            id: 'net0',
            bridge: 'vmbr0',
            model: 'virtio',
            macaddr: '00:00:00:00:00:00',
            firewall: true,
            linkdown: false,
          },
        ],
        cdrom: 'none',
        boot: 'order=scsi0',
        onboot: false,
        protection: false,
        tablet: true,
        usb: [],
      };

      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to fetch VM config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      // In real implementation, this would send the config to Proxmox API
      console.log('Saving VM config:', config);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save VM config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const addDisk = () => {
    if (!config) return;
    
    const newDisk: VMDisk = {
      id: `scsi${config.disks.length}`,
      storage: 'local-lvm',
      size: '10G',
      format: 'raw',
      cache: 'none',
      backup: true,
      replicate: true,
      ssd: false,
      iothread: false,
    };
    
    setConfig({
      ...config,
      disks: [...config.disks, newDisk],
    });
  };

  const removeDisk = (diskId: string) => {
    if (!config) return;
    
    setConfig({
      ...config,
      disks: config.disks.filter(disk => disk.id !== diskId),
    });
  };

  const updateDisk = (diskId: string, updates: Partial<VMDisk>) => {
    if (!config) return;
    
    setConfig({
      ...config,
      disks: config.disks.map(disk => 
        disk.id === diskId ? { ...disk, ...updates } : disk
      ),
    });
  };

  const addNetwork = () => {
    if (!config) return;
    
    const newNetwork: VMNetwork = {
      id: `net${config.networks.length}`,
      bridge: 'vmbr0',
      model: 'virtio',
      macaddr: '',
      firewall: true,
      linkdown: false,
    };
    
    setConfig({
      ...config,
      networks: [...config.networks, newNetwork],
    });
  };

  const removeNetwork = (netId: string) => {
    if (!config) return;
    
    setConfig({
      ...config,
      networks: config.networks.filter(net => net.id !== netId),
    });
  };

  const updateNetwork = (netId: string, updates: Partial<VMNetwork>) => {
    if (!config) return;
    
    setConfig({
      ...config,
      networks: config.networks.map(net => 
        net.id === netId ? { ...net, ...updates } : net
      ),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!config) {
    return <div>Failed to load VM configuration</div>;
  }

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">VM Name</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Machine Type</label>
          <select
            value={config.machine}
            onChange={(e) => setConfig({ ...config, machine: e.target.value })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="q35">q35</option>
            <option value="i440fx">i440fx</option>
          </select>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">BIOS</label>
          <select
            value={config.bios}
            onChange={(e) => setConfig({ ...config, bios: e.target.value })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="seabios">SeaBIOS</option>
            <option value="ovmf">OVMF (UEFI)</option>
          </select>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Boot Order</label>
          <input
            type="text"
            value={config.boot}
            onChange={(e) => setConfig({ ...config, boot: e.target.value })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="order=scsi0,net0"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="onboot"
            checked={config.onboot}
            onChange={(e) => setConfig({ ...config, onboot: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="onboot" className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
            Start at boot
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="protection"
            checked={config.protection}
            onChange={(e) => setConfig({ ...config, protection: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="protection" className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
            Protection (prevent destroy/remove)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="tablet"
            checked={config.tablet}
            onChange={(e) => setConfig({ ...config, tablet: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="tablet" className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
            Enable tablet for pointer
          </label>
        </div>
      </div>
    </div>
  );

  const renderCPUTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Sockets</label>
          <input
            type="number"
            min="1"
            max="4"
            value={config.sockets}
            onChange={(e) => setConfig({ ...config, sockets: parseInt(e.target.value) })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Cores</label>
          <input
            type="number"
            min="1"
            max="128"
            value={config.cores}
            onChange={(e) => setConfig({ ...config, cores: parseInt(e.target.value) })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Total CPUs</label>
          <input
            type="text"
            value={config.sockets * config.cores}
            disabled
            className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
          />
        </div>
      </div>
      
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">CPU Type</label>
        <select
          value={config.cpu}
          onChange={(e) => setConfig({ ...config, cpu: e.target.value })}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        >
          <option value="host">host</option>
          <option value="kvm64">kvm64</option>
          <option value="qemu64">qemu64</option>
          <option value="Broadwell">Broadwell</option>
          <option value="Haswell">Haswell</option>
          <option value="IvyBridge">IvyBridge</option>
          <option value="SandyBridge">SandyBridge</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="numa"
          checked={config.numa}
          onChange={(e) => setConfig({ ...config, numa: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="numa" className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
          Enable NUMA
        </label>
      </div>
    </div>
  );

  const renderMemoryTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Memory (MB)</label>
          <input
            type="number"
            min="64"
            max="1048576"
            step="64"
            value={config.memory}
            onChange={(e) => setConfig({ ...config, memory: parseInt(e.target.value) })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {(config.memory / 1024).toFixed(1)} GB
          </p>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Memory (MB)</label>
          <input
            type="number"
            min="64"
            max={config.memory}
            step="64"
            value={config.balloon}
            onChange={(e) => setConfig({ ...config, balloon: parseInt(e.target.value) })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Balloon device allows dynamic memory allocation
          </p>
        </div>
      </div>
    </div>
  );

  const renderDisksTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Hard Disks</h3>
        <button
          onClick={addDisk}
          className="flex items-center space-x-2 btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Add Disk</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {config.disks.map((disk) => (
          <div key={disk.id} className="p-4 bg-white border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">{disk.id.toUpperCase()}</h4>
              <button
                onClick={() => removeDisk(disk.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Storage</label>
                <select
                  value={disk.storage}
                  onChange={(e) => updateDisk(disk.id, { storage: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="local-lvm">local-lvm</option>
                  <option value="local">local</option>
                  <option value="nfs-storage">nfs-storage</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
                <input
                  type="text"
                  value={disk.size}
                  onChange={(e) => updateDisk(disk.id, { size: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="32G"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Cache</label>
                <select
                  value={disk.cache}
                  onChange={(e) => updateDisk(disk.id, { cache: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="none">None</option>
                  <option value="writethrough">Write through</option>
                  <option value="writeback">Write back</option>
                  <option value="unsafe">Unsafe</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`backup-${disk.id}`}
                  checked={disk.backup}
                  onChange={(e) => updateDisk(disk.id, { backup: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`backup-${disk.id}`} className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Backup
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`ssd-${disk.id}`}
                  checked={disk.ssd}
                  onChange={(e) => updateDisk(disk.id, { ssd: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`ssd-${disk.id}`} className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                  SSD emulation
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`iothread-${disk.id}`}
                  checked={disk.iothread}
                  onChange={(e) => updateDisk(disk.id, { iothread: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`iothread-${disk.id}`} className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                  IO thread
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`replicate-${disk.id}`}
                  checked={disk.replicate}
                  onChange={(e) => updateDisk(disk.id, { replicate: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`replicate-${disk.id}`} className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Replicate
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNetworkTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Network Devices</h3>
        <button
          onClick={addNetwork}
          className="flex items-center space-x-2 btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Add Network</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {config.networks.map((network) => (
          <div key={network.id} className="p-4 bg-white border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">{network.id.toUpperCase()}</h4>
              <button
                onClick={() => removeNetwork(network.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Bridge</label>
                <select
                  value={network.bridge}
                  onChange={(e) => updateNetwork(network.id, { bridge: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="vmbr0">vmbr0</option>
                  <option value="vmbr1">vmbr1</option>
                  <option value="vmbr2">vmbr2</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
                <select
                  value={network.model}
                  onChange={(e) => updateNetwork(network.id, { model: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="virtio">VirtIO (paravirtualized)</option>
                  <option value="e1000">Intel E1000</option>
                  <option value="rtl8139">Realtek RTL8139</option>
                  <option value="vmxnet3">VMware vmxnet3</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">MAC Address</label>
                <input
                  type="text"
                  value={network.macaddr}
                  onChange={(e) => updateNetwork(network.id, { macaddr: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="auto"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Rate Limit (MB/s)</label>
                <input
                  type="number"
                  value={network.rate || ''}
                  onChange={(e) => updateNetwork(network.id, { rate: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="unlimited"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">VLAN Tag</label>
                <input
                  type="number"
                  min="1"
                  max="4094"
                  value={network.tag || ''}
                  onChange={(e) => updateNetwork(network.id, { tag: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`firewall-${network.id}`}
                  checked={network.firewall}
                  onChange={(e) => updateNetwork(network.id, { firewall: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`firewall-${network.id}`} className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Firewall
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`linkdown-${network.id}`}
                  checked={network.linkdown}
                  onChange={(e) => updateNetwork(network.id, { linkdown: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`linkdown-${network.id}`} className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Disconnect
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOptionsTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">CD/DVD Drive</label>
        <select
          value={config.cdrom || 'none'}
          onChange={(e) => setConfig({ ...config, cdrom: e.target.value === 'none' ? undefined : e.target.value })}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        >
          <option value="none">None</option>
          <option value="local:iso/ubuntu-22.04.3-live-server-amd64.iso">Ubuntu 22.04 Server</option>
          <option value="local:iso/debian-12.2.0-amd64-netinst.iso">Debian 12</option>
          <option value="local:iso/windows-server-2022.iso">Windows Server 2022</option>
        </select>
      </div>
      
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Extra Arguments</label>
        <textarea
          value={config.args || ''}
          onChange={(e) => setConfig({ ...config, args: e.target.value })}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          rows={3}
          placeholder="Additional QEMU arguments"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Advanced: Extra arguments passed to QEMU
        </p>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">USB Devices</h4>
        <div className="space-y-3">
          {config.usb.map((usb, index) => (
            <div key={usb.id} className="flex items-center p-3 space-x-4 bg-white border border-gray-200 rounded dark:border-gray-700 dark:bg-gray-800">
              <Usb className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <input
                  type="text"
                  value={usb.host}
                  onChange={(e) => {
                    const newUsb = [...config.usb];
                    newUsb[index].host = e.target.value;
                    setConfig({ ...config, usb: newUsb });
                  }}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="vendor:product or spice"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={usb.usb3}
                  onChange={(e) => {
                    const newUsb = [...config.usb];
                    newUsb[index].usb3 = e.target.checked;
                    setConfig({ ...config, usb: newUsb });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">USB 3.0</label>
              </div>
              <button
                onClick={() => setConfig({ ...config, usb: config.usb.filter((_, i) => i !== index) })}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <button
            onClick={() => setConfig({
              ...config,
              usb: [...config.usb, { id: `usb${config.usb.length}`, host: 'spice', usb3: false }]
            })}
            className="flex items-center space-x-2 btn-secondary"
          >
            <Plus className="w-4 h-4" />
            <span>Add USB Device</span>
          </button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'cpu', label: 'CPU', icon: Cpu },
    { id: 'memory', label: 'Memory', icon: Memory },
    { id: 'disks', label: 'Hard Disks', icon: HardDrive },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'options', label: 'Options', icon: Monitor },
  ];

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative w-full max-w-6xl p-5 mx-auto bg-white border rounded-md shadow-lg top-10 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            VM Hardware Configuration - {config.name} (ID: {config.vmid})
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 btn-primary"
            >
              {saving ? (
                <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save</span>
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-48 pr-4 border-r border-gray-200 dark:border-gray-700">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-6">
            <div className="overflow-y-auto max-h-96">
              {activeTab === 'general' && renderGeneralTab()}
              {activeTab === 'cpu' && renderCPUTab()}
              {activeTab === 'memory' && renderMemoryTab()}
              {activeTab === 'disks' && renderDisksTab()}
              {activeTab === 'network' && renderNetworkTab()}
              {activeTab === 'options' && renderOptionsTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VMHardwareManager;