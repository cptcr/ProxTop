// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // ========== CONNECTION ==========
  connect: (config: any) => ipcRenderer.invoke('proxmox:connect', config),
  disconnect: () => ipcRenderer.invoke('proxmox:disconnect'),
  getUserInfo: () => ipcRenderer.invoke('proxmox:getUserInfo'),

  // ========== CLUSTER ==========
  getClusterStatus: () => ipcRenderer.invoke('proxmox:getClusterStatus'),
  getClusterResources: () => ipcRenderer.invoke('proxmox:getClusterResources'),
  getClusterConfig: () => ipcRenderer.invoke('proxmox:getClusterConfig'),
  getClusterOptions: () => ipcRenderer.invoke('proxmox:getClusterOptions'),
  updateClusterOptions: (options: any) => ipcRenderer.invoke('proxmox:updateClusterOptions', options),

  // ========== NODES ==========
  getNodes: () => ipcRenderer.invoke('proxmox:getNodes'),
  getNodeStatus: (nodeId: string) => ipcRenderer.invoke('proxmox:getNodeStatus', nodeId),
  getNodeVersion: (nodeId: string) => ipcRenderer.invoke('proxmox:getNodeVersion', nodeId),
  getNodeTime: (nodeId: string) => ipcRenderer.invoke('proxmox:getNodeTime', nodeId),
  getNodeDNS: (nodeId: string) => ipcRenderer.invoke('proxmox:getNodeDNS', nodeId),
  updateNodeDNS: (nodeId: string, dns: any) => ipcRenderer.invoke('proxmox:updateNodeDNS', nodeId, dns),
  getNodeHosts: (nodeId: string) => ipcRenderer.invoke('proxmox:getNodeHosts', nodeId),
  updateNodeHosts: (nodeId: string, hosts: string) => ipcRenderer.invoke('proxmox:updateNodeHosts', nodeId, hosts),

  // ========== VIRTUAL MACHINES ==========
  getVMs: (nodeId: string) => ipcRenderer.invoke('proxmox:getVMs', nodeId),
  getFilteredVMs: (nodeId: string) => ipcRenderer.invoke('proxmox:getFilteredVMs', nodeId),
  getVMStatus: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:getVMStatus', nodeId, vmId),
  getVMConfig: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:getVMConfig', nodeId, vmId),
  updateVMConfig: (nodeId: string, vmId: string, config: any) => ipcRenderer.invoke('proxmox:updateVMConfig', nodeId, vmId, config),
  createVM: (nodeId: string, config: any) => ipcRenderer.invoke('proxmox:createVM', nodeId, config),
  deleteVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:deleteVM', nodeId, vmId),
  
  // VM Power Management
  startVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:startVM', nodeId, vmId),
  stopVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:stopVM', nodeId, vmId),
  rebootVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:rebootVM', nodeId, vmId),
  suspendVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:suspendVM', nodeId, vmId),
  resumeVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:resumeVM', nodeId, vmId),
  resetVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:resetVM', nodeId, vmId),
  shutdownVM: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:shutdownVM', nodeId, vmId),
  
  // VM Advanced Operations
  migrateVM: (nodeId: string, vmId: string, target: string, options?: any) => 
    ipcRenderer.invoke('proxmox:migrateVM', nodeId, vmId, target, options),
  cloneVM: (nodeId: string, vmId: string, newid: string, options?: any) => 
    ipcRenderer.invoke('proxmox:cloneVM', nodeId, vmId, newid, options),
  
  // VM Snapshots
  getVMSnapshots: (nodeId: string, vmId: string) => ipcRenderer.invoke('proxmox:getVMSnapshots', nodeId, vmId),
  createVMSnapshot: (nodeId: string, vmId: string, snapname: string, description?: string) => 
    ipcRenderer.invoke('proxmox:createVMSnapshot', nodeId, vmId, snapname, description),
  deleteVMSnapshot: (nodeId: string, vmId: string, snapname: string) => 
    ipcRenderer.invoke('proxmox:deleteVMSnapshot', nodeId, vmId, snapname),
  rollbackVMSnapshot: (nodeId: string, vmId: string, snapname: string) => 
    ipcRenderer.invoke('proxmox:rollbackVMSnapshot', nodeId, vmId, snapname),

  // ========== CONTAINERS ==========
  getContainers: (nodeId: string) => ipcRenderer.invoke('proxmox:getContainers', nodeId),
  getFilteredContainers: (nodeId: string) => ipcRenderer.invoke('proxmox:getFilteredContainers', nodeId),
  getContainerStatus: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:getContainerStatus', nodeId, ctId),
  getContainerConfig: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:getContainerConfig', nodeId, ctId),
  updateContainerConfig: (nodeId: string, ctId: string, config: any) => 
    ipcRenderer.invoke('proxmox:updateContainerConfig', nodeId, ctId, config),
  createContainer: (nodeId: string, config: any) => ipcRenderer.invoke('proxmox:createContainer', nodeId, config),
  deleteContainer: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:deleteContainer', nodeId, ctId),
  
  // Container Power Management
  startContainer: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:startContainer', nodeId, ctId),
  stopContainer: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:stopContainer', nodeId, ctId),
  rebootContainer: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:rebootContainer', nodeId, ctId),
  suspendContainer: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:suspendContainer', nodeId, ctId),
  resumeContainer: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:resumeContainer', nodeId, ctId),
  shutdownContainer: (nodeId: string, ctId: string) => ipcRenderer.invoke('proxmox:shutdownContainer', nodeId, ctId),
  
  // Container Advanced Operations
  migrateContainer: (nodeId: string, ctId: string, target: string, options?: any) => 
    ipcRenderer.invoke('proxmox:migrateContainer', nodeId, ctId, target, options),
  cloneContainer: (nodeId: string, ctId: string, newid: string, options?: any) => 
    ipcRenderer.invoke('proxmox:cloneContainer', nodeId, ctId, newid, options),
  
  // Container Snapshots
  getContainerSnapshots: (nodeId: string, ctId: string) => 
    ipcRenderer.invoke('proxmox:getContainerSnapshots', nodeId, ctId),
  createContainerSnapshot: (nodeId: string, ctId: string, snapname: string, description?: string) => 
    ipcRenderer.invoke('proxmox:createContainerSnapshot', nodeId, ctId, snapname, description),

  // ========== STORAGE ==========
  getStorage: (nodeId?: string) => ipcRenderer.invoke('proxmox:getStorage', nodeId),
  getStorageContent: (nodeId: string, storage: string, content?: string) => 
    ipcRenderer.invoke('proxmox:getStorageContent', nodeId, storage, content),
  uploadToStorage: (nodeId: string, storage: string, file: FormData) => 
    ipcRenderer.invoke('proxmox:uploadToStorage', nodeId, storage, file),
  deleteStorageContent: (nodeId: string, storage: string, volume: string) => 
    ipcRenderer.invoke('proxmox:deleteStorageContent', nodeId, storage, volume),

  // ========== BACKUPS ==========
  getBackups: () => ipcRenderer.invoke('proxmox:getBackups'),
  createBackup: (nodeId: string, vmid: string, options: any) => 
    ipcRenderer.invoke('proxmox:createBackup', nodeId, vmid, options),
  getBackupJobs: () => ipcRenderer.invoke('proxmox:getBackupJobs'),
  createBackupJob: (job: any) => ipcRenderer.invoke('proxmox:createBackupJob', job),
  updateBackupJob: (id: string, job: any) => ipcRenderer.invoke('proxmox:updateBackupJob', id, job),
  deleteBackupJob: (id: string) => ipcRenderer.invoke('proxmox:deleteBackupJob', id),

  // ========== NETWORK ==========
  getNetworkConfig: (nodeId: string) => ipcRenderer.invoke('proxmox:getNetworkConfig', nodeId),
  updateNetworkConfig: (nodeId: string, iface: string, config: any) => 
    ipcRenderer.invoke('proxmox:updateNetworkConfig', nodeId, iface, config),
  createNetworkInterface: (nodeId: string, config: any) => 
    ipcRenderer.invoke('proxmox:createNetworkInterface', nodeId, config),
  deleteNetworkInterface: (nodeId: string, iface: string) => 
    ipcRenderer.invoke('proxmox:deleteNetworkInterface', nodeId, iface),
  applyNetworkConfig: (nodeId: string) => ipcRenderer.invoke('proxmox:applyNetworkConfig', nodeId),
  revertNetworkConfig: (nodeId: string) => ipcRenderer.invoke('proxmox:revertNetworkConfig', nodeId),

  // ========== FIREWALL ==========
  getFirewallGroups: () => ipcRenderer.invoke('proxmox:getFirewallGroups'),
  getFirewallRules: (nodeId?: string, vmId?: string) => 
    ipcRenderer.invoke('proxmox:getFirewallRules', nodeId, vmId),
  createFirewallRule: (rule: any, nodeId?: string, vmId?: string) => 
    ipcRenderer.invoke('proxmox:createFirewallRule', rule, nodeId, vmId),

  // ========== USERS & ACCESS ==========
  getUsers: () => ipcRenderer.invoke('proxmox:getUsers'),
  createUser: (user: any) => ipcRenderer.invoke('proxmox:createUser', user),
  updateUser: (userid: string, user: any) => ipcRenderer.invoke('proxmox:updateUser', userid, user),
  deleteUser: (userid: string) => ipcRenderer.invoke('proxmox:deleteUser', userid),
  getGroups: () => ipcRenderer.invoke('proxmox:getGroups'),
  createGroup: (group: any) => ipcRenderer.invoke('proxmox:createGroup', group),
  updateGroup: (groupid: string, group: any) => ipcRenderer.invoke('proxmox:updateGroup', groupid, group),
  deleteGroup: (groupid: string) => ipcRenderer.invoke('proxmox:deleteGroup', groupid),
  getRoles: () => ipcRenderer.invoke('proxmox:getRoles'),
  getACL: () => ipcRenderer.invoke('proxmox:getACL'),
  updateACL: (acl: any) => ipcRenderer.invoke('proxmox:updateACL', acl),

  // ========== MONITORING & STATISTICS ==========
  getNodeStats: (nodeId: string, timeframe?: string) => 
    ipcRenderer.invoke('proxmox:getNodeStats', nodeId, timeframe),
  getVMStats: (nodeId: string, vmId: string, timeframe?: string) => 
    ipcRenderer.invoke('proxmox:getVMStats', nodeId, vmId, timeframe),
  getContainerStats: (nodeId: string, ctId: string, timeframe?: string) => 
    ipcRenderer.invoke('proxmox:getContainerStats', nodeId, ctId, timeframe),
  getStorageStats: (nodeId: string, storage: string, timeframe?: string) => 
    ipcRenderer.invoke('proxmox:getStorageStats', nodeId, storage, timeframe),

  // ========== TASKS ==========
  getTasks: (nodeId?: string) => ipcRenderer.invoke('proxmox:getTasks', nodeId),
  getTaskStatus: (nodeId: string, upid: string) => ipcRenderer.invoke('proxmox:getTaskStatus', nodeId, upid),
  getTaskLog: (nodeId: string, upid: string) => ipcRenderer.invoke('proxmox:getTaskLog', nodeId, upid),
  stopTask: (nodeId: string, upid: string) => ipcRenderer.invoke('proxmox:stopTask', nodeId, upid),

  // ========== POOLS ==========
  getPools: () => ipcRenderer.invoke('proxmox:getPools'),
  createPool: (pool: any) => ipcRenderer.invoke('proxmox:createPool', pool),
  updatePool: (poolid: string, pool: any) => ipcRenderer.invoke('proxmox:updatePool', poolid, pool),
  deletePool: (poolid: string) => ipcRenderer.invoke('proxmox:deletePool', poolid),

  // ========== TEMPLATES ==========
  getTemplates: (nodeId: string) => ipcRenderer.invoke('proxmox:getTemplates', nodeId),
  downloadTemplate: (nodeId: string, template: string) => 
    ipcRenderer.invoke('proxmox:downloadTemplate', nodeId, template),

  // ========== CERTIFICATES ==========
  getCertificates: (nodeId: string) => ipcRenderer.invoke('proxmox:getCertificates', nodeId),
  uploadCertificate: (nodeId: string, cert: any) => 
    ipcRenderer.invoke('proxmox:uploadCertificate', nodeId, cert),

  // ========== REPLICATION ==========
  getReplicationJobs: () => ipcRenderer.invoke('proxmox:getReplicationJobs'),
  createReplicationJob: (job: any) => ipcRenderer.invoke('proxmox:createReplicationJob', job),
  updateReplicationJob: (id: string, job: any) => 
    ipcRenderer.invoke('proxmox:updateReplicationJob', id, job),
  deleteReplicationJob: (id: string) => ipcRenderer.invoke('proxmox:deleteReplicationJob', id),

  // ========== CEPH ==========
  getCephStatus: (nodeId: string) => ipcRenderer.invoke('proxmox:getCephStatus', nodeId),
  getCephOSDs: (nodeId: string) => ipcRenderer.invoke('proxmox:getCephOSDs', nodeId),
  getCephMONs: (nodeId: string) => ipcRenderer.invoke('proxmox:getCephMONs', nodeId),
  getCephPools: (nodeId: string) => ipcRenderer.invoke('proxmox:getCephPools', nodeId),

  // ========== HIGH AVAILABILITY ==========
  getHAResources: () => ipcRenderer.invoke('proxmox:getHAResources'),
  getHAGroups: () => ipcRenderer.invoke('proxmox:getHAGroups'),
  getHAStatus: () => ipcRenderer.invoke('proxmox:getHAStatus'),
  createHAResource: (resource: any) => ipcRenderer.invoke('proxmox:createHAResource', resource),

  // ========== MENU EVENTS ==========
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