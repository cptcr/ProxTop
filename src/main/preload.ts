// src/main/preload.ts - DEBUG VERSION MIT CONSOLE LOGS
import { contextBridge, ipcRenderer } from 'electron';

console.log('🔧 Preload script loading...');

const electronAPI = {
  // ========== CONNECTION ==========
  connect: (config: any) => {
    console.log('🔌 API Call: connect', config);
    return ipcRenderer.invoke('proxmox:connect', config);
  },
  disconnect: () => {
    console.log('🔌 API Call: disconnect');
    return ipcRenderer.invoke('proxmox:disconnect');
  },
  getUserInfo: () => {
    console.log('👤 API Call: getUserInfo');
    return ipcRenderer.invoke('proxmox:getUserInfo');
  },

  // ========== CLUSTER ==========
  getClusterStatus: () => {
    console.log('🏠 API Call: getClusterStatus');
    return ipcRenderer.invoke('proxmox:getClusterStatus');
  },
  getClusterResources: () => {
    console.log('🏠 API Call: getClusterResources');
    return ipcRenderer.invoke('proxmox:getClusterResources');
  },
  getClusterConfig: () => {
    console.log('🏠 API Call: getClusterConfig');
    return ipcRenderer.invoke('proxmox:getClusterConfig');
  },
  getClusterOptions: () => {
    console.log('🏠 API Call: getClusterOptions');
    return ipcRenderer.invoke('proxmox:getClusterOptions');
  },
  updateClusterOptions: (options: any) => {
    console.log('🏠 API Call: updateClusterOptions', options);
    return ipcRenderer.invoke('proxmox:updateClusterOptions', options);
  },

  // ========== NODES ==========
  getNodes: () => {
    console.log('🖥️ API Call: getNodes');
    return ipcRenderer.invoke('proxmox:getNodes');
  },
  getNodeStatus: (nodeId: string) => {
    console.log('🖥️ API Call: getNodeStatus', nodeId);
    return ipcRenderer.invoke('proxmox:getNodeStatus', nodeId);
  },
  getNodeVersion: (nodeId: string) => {
    console.log('🖥️ API Call: getNodeVersion', nodeId);
    return ipcRenderer.invoke('proxmox:getNodeVersion', nodeId);
  },
  getNodeTime: (nodeId: string) => {
    console.log('🖥️ API Call: getNodeTime', nodeId);
    return ipcRenderer.invoke('proxmox:getNodeTime', nodeId);
  },
  getNodeDNS: (nodeId: string) => {
    console.log('🖥️ API Call: getNodeDNS', nodeId);
    return ipcRenderer.invoke('proxmox:getNodeDNS', nodeId);
  },
  updateNodeDNS: (nodeId: string, dns: any) => {
    console.log('🖥️ API Call: updateNodeDNS', nodeId, dns);
    return ipcRenderer.invoke('proxmox:updateNodeDNS', nodeId, dns);
  },
  getNodeHosts: (nodeId: string) => {
    console.log('🖥️ API Call: getNodeHosts', nodeId);
    return ipcRenderer.invoke('proxmox:getNodeHosts', nodeId);
  },
  updateNodeHosts: (nodeId: string, hosts: string) => {
    console.log('🖥️ API Call: updateNodeHosts', nodeId, hosts);
    return ipcRenderer.invoke('proxmox:updateNodeHosts', nodeId, hosts);
  },

  // ========== VIRTUAL MACHINES ==========
  getVMs: (nodeId: string) => {
    console.log('💻 API Call: getVMs', nodeId);
    return ipcRenderer.invoke('proxmox:getVMs', nodeId);
  },
  getFilteredVMs: (nodeId: string) => {
    console.log('💻 API Call: getFilteredVMs', nodeId);
    return ipcRenderer.invoke('proxmox:getFilteredVMs', nodeId);
  },
  getVMStatus: (nodeId: string, vmId: string) => {
    console.log('💻 API Call: getVMStatus', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:getVMStatus', nodeId, vmId);
  },
  getVMConfig: (nodeId: string, vmId: string) => {
    console.log('💻 API Call: getVMConfig', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:getVMConfig', nodeId, vmId);
  },
  updateVMConfig: (nodeId: string, vmId: string, config: any) => {
    console.log('💻 API Call: updateVMConfig', nodeId, vmId, config);
    return ipcRenderer.invoke('proxmox:updateVMConfig', nodeId, vmId, config);
  },
  createVM: (nodeId: string, config: any) => {
    console.log('💻 API Call: createVM', nodeId, config);
    return ipcRenderer.invoke('proxmox:createVM', nodeId, config);
  },
  deleteVM: (nodeId: string, vmId: string) => {
    console.log('💻 API Call: deleteVM', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:deleteVM', nodeId, vmId);
  },
  
  // VM Power Management
  startVM: (nodeId: string, vmId: string) => {
    console.log('▶️ API Call: startVM', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:startVM', nodeId, vmId);
  },
  stopVM: (nodeId: string, vmId: string) => {
    console.log('⏹️ API Call: stopVM', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:stopVM', nodeId, vmId);
  },
  rebootVM: (nodeId: string, vmId: string) => {
    console.log('🔄 API Call: rebootVM', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:rebootVM', nodeId, vmId);
  },
  suspendVM: (nodeId: string, vmId: string) => {
    console.log('⏸️ API Call: suspendVM', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:suspendVM', nodeId, vmId);
  },
  resumeVM: (nodeId: string, vmId: string) => {
    console.log('▶️ API Call: resumeVM', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:resumeVM', nodeId, vmId);
  },
  resetVM: (nodeId: string, vmId: string) => {
    console.log('🔄 API Call: resetVM', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:resetVM', nodeId, vmId);
  },
  shutdownVM: (nodeId: string, vmId: string) => {
    console.log('🔽 API Call: shutdownVM', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:shutdownVM', nodeId, vmId);
  },
  
  // VM Advanced Operations
  migrateVM: (nodeId: string, vmId: string, target: string, options?: any) => {
    console.log('🚀 API Call: migrateVM', nodeId, vmId, target, options);
    return ipcRenderer.invoke('proxmox:migrateVM', nodeId, vmId, target, options);
  },
  cloneVM: (nodeId: string, vmId: string, newid: string, options?: any) => {
    console.log('📋 API Call: cloneVM', nodeId, vmId, newid, options);
    return ipcRenderer.invoke('proxmox:cloneVM', nodeId, vmId, newid, options);
  },
  
  // VM Snapshots
  getVMSnapshots: (nodeId: string, vmId: string) => {
    console.log('📸 API Call: getVMSnapshots', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:getVMSnapshots', nodeId, vmId);
  },
  createVMSnapshot: (nodeId: string, vmId: string, snapname: string, description?: string) => {
    console.log('📸 API Call: createVMSnapshot', nodeId, vmId, snapname, description);
    return ipcRenderer.invoke('proxmox:createVMSnapshot', nodeId, vmId, snapname, description);
  },
  deleteVMSnapshot: (nodeId: string, vmId: string, snapname: string) => {
    console.log('🗑️ API Call: deleteVMSnapshot', nodeId, vmId, snapname);
    return ipcRenderer.invoke('proxmox:deleteVMSnapshot', nodeId, vmId, snapname);
  },
  rollbackVMSnapshot: (nodeId: string, vmId: string, snapname: string) => {
    console.log('⏪ API Call: rollbackVMSnapshot', nodeId, vmId, snapname);
    return ipcRenderer.invoke('proxmox:rollbackVMSnapshot', nodeId, vmId, snapname);
  },

  // ========== CONTAINERS ==========
  getContainers: (nodeId: string) => {
    console.log('📦 API Call: getContainers', nodeId);
    return ipcRenderer.invoke('proxmox:getContainers', nodeId);
  },
  getFilteredContainers: (nodeId: string) => {
    console.log('📦 API Call: getFilteredContainers', nodeId);
    return ipcRenderer.invoke('proxmox:getFilteredContainers', nodeId);
  },
  getContainerStatus: (nodeId: string, ctId: string) => {
    console.log('📦 API Call: getContainerStatus', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:getContainerStatus', nodeId, ctId);
  },
  getContainerConfig: (nodeId: string, ctId: string) => {
    console.log('📦 API Call: getContainerConfig', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:getContainerConfig', nodeId, ctId);
  },
  updateContainerConfig: (nodeId: string, ctId: string, config: any) => {
    console.log('📦 API Call: updateContainerConfig', nodeId, ctId, config);
    return ipcRenderer.invoke('proxmox:updateContainerConfig', nodeId, ctId, config);
  },
  createContainer: (nodeId: string, config: any) => {
    console.log('📦 API Call: createContainer', nodeId, config);
    return ipcRenderer.invoke('proxmox:createContainer', nodeId, config);
  },
  deleteContainer: (nodeId: string, ctId: string) => {
    console.log('📦 API Call: deleteContainer', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:deleteContainer', nodeId, ctId);
  },
  
  // Container Power Management
  startContainer: (nodeId: string, ctId: string) => {
    console.log('▶️ API Call: startContainer', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:startContainer', nodeId, ctId);
  },
  stopContainer: (nodeId: string, ctId: string) => {
    console.log('⏹️ API Call: stopContainer', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:stopContainer', nodeId, ctId);
  },
  rebootContainer: (nodeId: string, ctId: string) => {
    console.log('🔄 API Call: rebootContainer', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:rebootContainer', nodeId, ctId);
  },
  suspendContainer: (nodeId: string, ctId: string) => {
    console.log('⏸️ API Call: suspendContainer', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:suspendContainer', nodeId, ctId);
  },
  resumeContainer: (nodeId: string, ctId: string) => {
    console.log('▶️ API Call: resumeContainer', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:resumeContainer', nodeId, ctId);
  },
  shutdownContainer: (nodeId: string, ctId: string) => {
    console.log('🔽 API Call: shutdownContainer', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:shutdownContainer', nodeId, ctId);
  },
  
  // Container Advanced Operations
  migrateContainer: (nodeId: string, ctId: string, target: string, options?: any) => {
    console.log('🚀 API Call: migrateContainer', nodeId, ctId, target, options);
    return ipcRenderer.invoke('proxmox:migrateContainer', nodeId, ctId, target, options);
  },
  cloneContainer: (nodeId: string, ctId: string, newid: string, options?: any) => {
    console.log('📋 API Call: cloneContainer', nodeId, ctId, newid, options);
    return ipcRenderer.invoke('proxmox:cloneContainer', nodeId, ctId, newid, options);
  },
  
  // Container Snapshots
  getContainerSnapshots: (nodeId: string, ctId: string) => {
    console.log('📸 API Call: getContainerSnapshots', nodeId, ctId);
    return ipcRenderer.invoke('proxmox:getContainerSnapshots', nodeId, ctId);
  },
  createContainerSnapshot: (nodeId: string, ctId: string, snapname: string, description?: string) => {
    console.log('📸 API Call: createContainerSnapshot', nodeId, ctId, snapname, description);
    return ipcRenderer.invoke('proxmox:createContainerSnapshot', nodeId, ctId, snapname, description);
  },

  // ========== STORAGE ==========
  getStorage: (nodeId?: string) => {
    console.log('💾 API Call: getStorage', nodeId);
    return ipcRenderer.invoke('proxmox:getStorage', nodeId);
  },
  getStorageContent: (nodeId: string, storage: string, content?: string) => {
    console.log('💾 API Call: getStorageContent', nodeId, storage, content);
    return ipcRenderer.invoke('proxmox:getStorageContent', nodeId, storage, content);
  },
  uploadToStorage: (nodeId: string, storage: string, file: FormData) => {
    console.log('📤 API Call: uploadToStorage', nodeId, storage);
    return ipcRenderer.invoke('proxmox:uploadToStorage', nodeId, storage, file);
  },
  deleteStorageContent: (nodeId: string, storage: string, volume: string) => {
    console.log('🗑️ API Call: deleteStorageContent', nodeId, storage, volume);
    return ipcRenderer.invoke('proxmox:deleteStorageContent', nodeId, storage, volume);
  },

  // ========== BACKUPS ==========
  getBackups: () => {
    console.log('💼 API Call: getBackups');
    return ipcRenderer.invoke('proxmox:getBackups');
  },
  createBackup: (nodeId: string, vmid: string, options: any) => {
    console.log('💼 API Call: createBackup', nodeId, vmid, options);
    return ipcRenderer.invoke('proxmox:createBackup', nodeId, vmid, options);
  },
  getBackupJobs: () => {
    console.log('💼 API Call: getBackupJobs');
    return ipcRenderer.invoke('proxmox:getBackupJobs');
  },
  createBackupJob: (job: any) => {
    console.log('💼 API Call: createBackupJob', job);
    return ipcRenderer.invoke('proxmox:createBackupJob', job);
  },
  updateBackupJob: (id: string, job: any) => {
    console.log('💼 API Call: updateBackupJob', id, job);
    return ipcRenderer.invoke('proxmox:updateBackupJob', id, job);
  },
  deleteBackupJob: (id: string) => {
    console.log('💼 API Call: deleteBackupJob', id);
    return ipcRenderer.invoke('proxmox:deleteBackupJob', id);
  },

  // ========== NETWORK ==========
  getNetworkConfig: (nodeId: string) => {
    console.log('🌐 API Call: getNetworkConfig', nodeId);
    return ipcRenderer.invoke('proxmox:getNetworkConfig', nodeId);
  },
  updateNetworkConfig: (nodeId: string, iface: string, config: any) => {
    console.log('🌐 API Call: updateNetworkConfig', nodeId, iface, config);
    return ipcRenderer.invoke('proxmox:updateNetworkConfig', nodeId, iface, config);
  },
  createNetworkInterface: (nodeId: string, config: any) => {
    console.log('🌐 API Call: createNetworkInterface', nodeId, config);
    return ipcRenderer.invoke('proxmox:createNetworkInterface', nodeId, config);
  },
  deleteNetworkInterface: (nodeId: string, iface: string) => {
    console.log('🌐 API Call: deleteNetworkInterface', nodeId, iface);
    return ipcRenderer.invoke('proxmox:deleteNetworkInterface', nodeId, iface);
  },
  applyNetworkConfig: (nodeId: string) => {
    console.log('🌐 API Call: applyNetworkConfig', nodeId);
    return ipcRenderer.invoke('proxmox:applyNetworkConfig', nodeId);
  },
  revertNetworkConfig: (nodeId: string) => {
    console.log('🌐 API Call: revertNetworkConfig', nodeId);
    return ipcRenderer.invoke('proxmox:revertNetworkConfig', nodeId);
  },

  // ========== FIREWALL ==========
  getFirewallGroups: () => {
    console.log('🔥 API Call: getFirewallGroups');
    return ipcRenderer.invoke('proxmox:getFirewallGroups');
  },
  getFirewallRules: (nodeId?: string, vmId?: string) => {
    console.log('🔥 API Call: getFirewallRules', nodeId, vmId);
    return ipcRenderer.invoke('proxmox:getFirewallRules', nodeId, vmId);
  },
  createFirewallRule: (rule: any, nodeId?: string, vmId?: string) => {
    console.log('🔥 API Call: createFirewallRule', rule, nodeId, vmId);
    return ipcRenderer.invoke('proxmox:createFirewallRule', rule, nodeId, vmId);
  },

  // ========== USERS & ACCESS ==========
  getUsers: () => {
    console.log('👥 API Call: getUsers');
    return ipcRenderer.invoke('proxmox:getUsers');
  },
  createUser: (user: any) => {
    console.log('👥 API Call: createUser', user);
    return ipcRenderer.invoke('proxmox:createUser', user);
  },
  updateUser: (userid: string, user: any) => {
    console.log('👥 API Call: updateUser', userid, user);
    return ipcRenderer.invoke('proxmox:updateUser', userid, user);
  },
  deleteUser: (userid: string) => {
    console.log('👥 API Call: deleteUser', userid);
    return ipcRenderer.invoke('proxmox:deleteUser', userid);
  },
  getGroups: () => {
    console.log('👥 API Call: getGroups');
    return ipcRenderer.invoke('proxmox:getGroups');
  },
  createGroup: (group: any) => {
    console.log('👥 API Call: createGroup', group);
    return ipcRenderer.invoke('proxmox:createGroup', group);
  },
  updateGroup: (groupid: string, group: any) => {
    console.log('👥 API Call: updateGroup', groupid, group);
    return ipcRenderer.invoke('proxmox:updateGroup', groupid, group);
  },
  deleteGroup: (groupid: string) => {
    console.log('👥 API Call: deleteGroup', groupid);
    return ipcRenderer.invoke('proxmox:deleteGroup', groupid);
  },
  getRoles: () => {
    console.log('👥 API Call: getRoles');
    return ipcRenderer.invoke('proxmox:getRoles');
  },
  getACL: () => {
    console.log('👥 API Call: getACL');
    return ipcRenderer.invoke('proxmox:getACL');
  },
  updateACL: (acl: any) => {
    console.log('👥 API Call: updateACL', acl);
    return ipcRenderer.invoke('proxmox:updateACL', acl);
  },

  // ========== MONITORING & STATISTICS ==========
  getNodeStats: (nodeId: string, timeframe?: string) => {
    console.log('📊 API Call: getNodeStats', nodeId, timeframe);
    return ipcRenderer.invoke('proxmox:getNodeStats', nodeId, timeframe);
  },
  getVMStats: (nodeId: string, vmId: string, timeframe?: string) => {
    console.log('📊 API Call: getVMStats', nodeId, vmId, timeframe);
    return ipcRenderer.invoke('proxmox:getVMStats', nodeId, vmId, timeframe);
  },
  getContainerStats: (nodeId: string, ctId: string, timeframe?: string) => {
    console.log('📊 API Call: getContainerStats', nodeId, ctId, timeframe);
    return ipcRenderer.invoke('proxmox:getContainerStats', nodeId, ctId, timeframe);
  },
  getStorageStats: (nodeId: string, storage: string, timeframe?: string) => {
    console.log('📊 API Call: getStorageStats', nodeId, storage, timeframe);
    return ipcRenderer.invoke('proxmox:getStorageStats', nodeId, storage, timeframe);
  },

  // ========== TASKS ==========
  getTasks: (nodeId?: string) => {
    console.log('📋 API Call: getTasks', nodeId);
    return ipcRenderer.invoke('proxmox:getTasks', nodeId);
  },
  getTaskStatus: (nodeId: string, upid: string) => {
    console.log('📋 API Call: getTaskStatus', nodeId, upid);
    return ipcRenderer.invoke('proxmox:getTaskStatus', nodeId, upid);
  },
  getTaskLog: (nodeId: string, upid: string) => {
    console.log('📋 API Call: getTaskLog', nodeId, upid);
    return ipcRenderer.invoke('proxmox:getTaskLog', nodeId, upid);
  },
  stopTask: (nodeId: string, upid: string) => {
    console.log('📋 API Call: stopTask', nodeId, upid);
    return ipcRenderer.invoke('proxmox:stopTask', nodeId, upid);
  },

  // ========== POOLS ==========
  getPools: () => {
    console.log('🏊 API Call: getPools');
    return ipcRenderer.invoke('proxmox:getPools');
  },
  createPool: (pool: any) => {
    console.log('🏊 API Call: createPool', pool);
    return ipcRenderer.invoke('proxmox:createPool', pool);
  },
  updatePool: (poolid: string, pool: any) => {
    console.log('🏊 API Call: updatePool', poolid, pool);
    return ipcRenderer.invoke('proxmox:updatePool', poolid, pool);
  },
  deletePool: (poolid: string) => {
    console.log('🏊 API Call: deletePool', poolid);
    return ipcRenderer.invoke('proxmox:deletePool', poolid);
  },

  // ========== TEMPLATES ==========
  getTemplates: (nodeId: string) => {
    console.log('📋 API Call: getTemplates', nodeId);
    return ipcRenderer.invoke('proxmox:getTemplates', nodeId);
  },
  downloadTemplate: (nodeId: string, template: string) => {
    console.log('📥 API Call: downloadTemplate', nodeId, template);
    return ipcRenderer.invoke('proxmox:downloadTemplate', nodeId, template);
  },

  // ========== CERTIFICATES ==========
  getCertificates: (nodeId: string) => {
    console.log('🔐 API Call: getCertificates', nodeId);
    return ipcRenderer.invoke('proxmox:getCertificates', nodeId);
  },
  uploadCertificate: (nodeId: string, cert: any) => {
    console.log('🔐 API Call: uploadCertificate', nodeId, cert);
    return ipcRenderer.invoke('proxmox:uploadCertificate', nodeId, cert);
  },

  // ========== REPLICATION ==========
  getReplicationJobs: () => {
    console.log('🔄 API Call: getReplicationJobs');
    return ipcRenderer.invoke('proxmox:getReplicationJobs');
  },
  createReplicationJob: (job: any) => {
    console.log('🔄 API Call: createReplicationJob', job);
    return ipcRenderer.invoke('proxmox:createReplicationJob', job);
  },
  updateReplicationJob: (id: string, job: any) => {
    console.log('🔄 API Call: updateReplicationJob', id, job);
    return ipcRenderer.invoke('proxmox:updateReplicationJob', id, job);
  },
  deleteReplicationJob: (id: string) => {
    console.log('🔄 API Call: deleteReplicationJob', id);
    return ipcRenderer.invoke('proxmox:deleteReplicationJob', id);
  },

  // ========== CEPH ==========
  getCephStatus: (nodeId: string) => {
    console.log('🐙 API Call: getCephStatus', nodeId);
    return ipcRenderer.invoke('proxmox:getCephStatus', nodeId);
  },
  getCephOSDs: (nodeId: string) => {
    console.log('🐙 API Call: getCephOSDs', nodeId);
    return ipcRenderer.invoke('proxmox:getCephOSDs', nodeId);
  },
  getCephMONs: (nodeId: string) => {
    console.log('🐙 API Call: getCephMONs', nodeId);
    return ipcRenderer.invoke('proxmox:getCephMONs', nodeId);
  },
  getCephPools: (nodeId: string) => {
    console.log('🐙 API Call: getCephPools', nodeId);
    return ipcRenderer.invoke('proxmox:getCephPools', nodeId);
  },

  // ========== HIGH AVAILABILITY ==========
  getHAResources: () => {
    console.log('🏗️ API Call: getHAResources');
    return ipcRenderer.invoke('proxmox:getHAResources');
  },
  getHAGroups: () => {
    console.log('🏗️ API Call: getHAGroups');
    return ipcRenderer.invoke('proxmox:getHAGroups');
  },
  getHAStatus: () => {
    console.log('🏗️ API Call: getHAStatus');
    return ipcRenderer.invoke('proxmox:getHAStatus');
  },
  createHAResource: (resource: any) => {
    console.log('🏗️ API Call: createHAResource', resource);
    return ipcRenderer.invoke('proxmox:createHAResource', resource);
  },

  // ========== MENU EVENTS ==========
  onMenuConnect: (callback: () => void) => {
    console.log('📋 Setting up menu connect listener');
    ipcRenderer.on('menu-connect', callback);
    return () => ipcRenderer.removeListener('menu-connect', callback);
  },
};

console.log('🔧 Exposing electronAPI to window...');
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('✅ Preload script loaded successfully!');
console.log('🔧 Available API methods:', Object.keys(electronAPI));

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}