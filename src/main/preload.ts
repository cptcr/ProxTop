import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Connection
  connect: (config: any) => ipcRenderer.invoke('proxmox:connect', config),
  disconnect: () => ipcRenderer.invoke('proxmox:disconnect'),

  // Nodes
  getNodes: () => ipcRenderer.invoke('proxmox:getNodes'),
  getNodeStatus: (nodeId: string) => ipcRenderer.invoke('proxmox:getNodeStatus', nodeId),

  // VMs
  getVMs: (nodeId: string) => ipcRenderer.invoke('proxmox:getVMs', nodeId),
  startVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:startVM', nodeId, vmId),
  stopVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:stopVM', nodeId, vmId),
  rebootVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:rebootVM', nodeId, vmId),

  // Containers
  getContainers: (nodeId: string) => ipcRenderer.invoke('proxmox:getContainers', nodeId),
  startContainer: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:startContainer', nodeId, ctId),
  stopContainer: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:stopContainer', nodeId, ctId),

  // Storage
  getStorage: (nodeId: string) => ipcRenderer.invoke('proxmox:getStorage', nodeId),

  // Backups
  getBackups: () => ipcRenderer.invoke('proxmox:getBackups'),
  createBackup: (nodeId: string, vmId: string, options: any) => 
    ipcRenderer.invoke('proxmox:createBackup', nodeId, vmId, options),

  // Cluster
  getClusterStatus: () => ipcRenderer.invoke('proxmox:getClusterStatus'),
  getClusterResources: () => ipcRenderer.invoke('proxmox:getClusterResources'),

  // Menu events
  onMenuConnect: (callback: () => void) => {
    ipcRenderer.on('menu-connect', callback);
    return () => ipcRenderer.removeListener('menu-connect', callback);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}