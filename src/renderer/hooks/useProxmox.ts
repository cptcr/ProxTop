// src/renderer/hooks/useProxmox.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  ProxmoxNode, 
  ProxmoxVM, 
  ProxmoxContainer, 
  ProxmoxStorage, 
  ClusterResource 
} from '../types/proxmox';

interface UserInfo {
  userid: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  groups?: string[];
  enable: boolean;
  expire?: number;
  comment?: string;
  realm: string;
  permissions: { [path: string]: string[] };
}

interface TaskInfo {
  upid: string;
  type: string;
  id?: string;
  user: string;
  node: string;
  pid: number;
  pstart: number;
  starttime: number;
  status: string;
  exitstatus?: string;
}

interface BackupJob {
  id: string;
  node: string;
  vmid: string;
  type: string;
  schedule: string;
  enabled: boolean;
  storage: string;
  compress: string;
  mode: string;
}

interface ReplicationJob {
  id: string;
  type: string;
  target: string;
  guest: string;
  schedule: string;
  enabled: boolean;
}

export const useProxmox = () => {
  const [nodes, setNodes] = useState<ProxmoxNode[]>([]);
  const [clusterResources, setClusterResources] = useState<ClusterResource[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [replicationJobs, setReplicationJobs] = useState<ReplicationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission checking function
  const hasPermission = useCallback((path: string, privilege: string): boolean => {
    if (!userInfo) return false;
    
    // Root user has all permissions
    if (userInfo.userid.startsWith('root@')) return true;
    
    // Check specific path permissions
    const pathPerms = userInfo.permissions[path];
    if (pathPerms && pathPerms.includes(privilege)) return true;
    
    // Check parent path permissions
    const pathParts = path.split('/');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('/');
      const parentPerms = userInfo.permissions[parentPath];
      if (parentPerms && parentPerms.includes(privilege)) return true;
    }
    
    return false;
  }, [userInfo]);

  // Fetch user information
  const getUserInfo = useCallback(async (): Promise<UserInfo | null> => {
    try {
      const info = await window.electronAPI.getUserInfo();
      setUserInfo(info);
      return info;
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      return null;
    }
  }, []);

  // Main data fetching functions
  const fetchNodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const nodeData = await window.electronAPI.getNodes();
      setNodes(nodeData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClusterResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resources = await window.electronAPI.getClusterResources();
      setClusterResources(resources);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async (nodeId?: string) => {
    try {
      const taskData = await window.electronAPI.getTasks(nodeId);
      setTasks(taskData);
      return taskData;
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, []);

  const fetchBackupJobs = useCallback(async () => {
    try {
      const jobs = await window.electronAPI.getBackupJobs();
      setBackupJobs(jobs);
      return jobs;
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, []);

  const fetchReplicationJobs = useCallback(async () => {
    try {
      const jobs = await window.electronAPI.getReplicationJobs();
      setReplicationJobs(jobs);
      return jobs;
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, []);

  // VM Management
  const getVMs = useCallback(async (nodeId: string): Promise<ProxmoxVM[]> => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'VM.Audit')) {
        throw new Error('Insufficient permissions to view VMs');
      }
      return await window.electronAPI.getVMs(nodeId);
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [hasPermission]);

  const getFilteredVMs = useCallback(async (nodeId: string): Promise<ProxmoxVM[]> => {
    try {
      const allVMs = await window.electronAPI.getVMs(nodeId);
      
      if (!userInfo || userInfo.userid.startsWith('root@')) {
        return allVMs;
      }

      // Filter VMs based on user permissions
      return allVMs.filter((vm: { vmid: any; }) => 
        hasPermission(`/vms/${vm.vmid}`, 'VM.Audit') ||
        hasPermission(`/nodes/${nodeId}`, 'VM.Audit')
      );
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [userInfo, hasPermission]);

  const getVMConfig = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.Audit')) {
        throw new Error('Insufficient permissions to view VM configuration');
      }
      return await window.electronAPI.getVMConfig(nodeId, vmId);
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [hasPermission]);

  const updateVMConfig = useCallback(async (nodeId: string, vmId: string, config: any) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.Config')) {
        throw new Error('Insufficient permissions to modify VM configuration');
      }
      return await window.electronAPI.updateVMConfig(nodeId, vmId, config);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  const createVM = useCallback(async (nodeId: string, config: any) => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'VM.Allocate')) {
        throw new Error('Insufficient permissions to create VMs');
      }
      return await window.electronAPI.createVM(nodeId, config);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  const deleteVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.Allocate')) {
        throw new Error('Insufficient permissions to delete VMs');
      }
      return await window.electronAPI.deleteVM(nodeId, vmId);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  const startVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to start VMs');
      }
      await window.electronAPI.startVM(nodeId, vmId);
      await fetchClusterResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [hasPermission, fetchClusterResources]);

  const stopVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to stop VMs');
      }
      await window.electronAPI.stopVM(nodeId, vmId);
      await fetchClusterResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [hasPermission, fetchClusterResources]);

  const rebootVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to reboot VMs');
      }
      await window.electronAPI.rebootVM(nodeId, vmId);
      await fetchClusterResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [hasPermission, fetchClusterResources]);

  const suspendVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to suspend VMs');
      }
      await window.electronAPI.suspendVM(nodeId, vmId);
      await fetchClusterResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [hasPermission, fetchClusterResources]);

  const resumeVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to resume VMs');
      }
      await window.electronAPI.resumeVM(nodeId, vmId);
      await fetchClusterResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [hasPermission, fetchClusterResources]);

  const shutdownVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to shutdown VMs');
      }
      await window.electronAPI.shutdownVM(nodeId, vmId);
      await fetchClusterResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [hasPermission, fetchClusterResources]);

  const resetVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to reset VMs');
      }
      await window.electronAPI.resetVM(nodeId, vmId);
      await fetchClusterResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [hasPermission, fetchClusterResources]);

  const migrateVM = useCallback(async (nodeId: string, vmId: string, target: string, options?: any) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.Migrate')) {
        throw new Error('Insufficient permissions to migrate VMs');
      }
      return await window.electronAPI.migrateVM(nodeId, vmId, target, options);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  const cloneVM = useCallback(async (nodeId: string, vmId: string, newid: string, options?: any) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.Clone')) {
        throw new Error('Insufficient permissions to clone VMs');
      }
      return await window.electronAPI.cloneVM(nodeId, vmId, newid, options);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  // Container Management
  const getContainers = useCallback(async (nodeId: string): Promise<ProxmoxContainer[]> => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'VM.Audit')) {
        throw new Error('Insufficient permissions to view containers');
      }
      return await window.electronAPI.getContainers(nodeId);
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [hasPermission]);

  const getFilteredContainers = useCallback(async (nodeId: string): Promise<ProxmoxContainer[]> => {
    try {
      const allContainers = await window.electronAPI.getContainers(nodeId);
      
      if (!userInfo || userInfo.userid.startsWith('root@')) {
        return allContainers;
      }

      // Filter containers based on user permissions
      return allContainers.filter((ct: { vmid: any; }) => 
        hasPermission(`/vms/${ct.vmid}`, 'VM.Audit') ||
        hasPermission(`/nodes/${nodeId}`, 'VM.Audit')
      );
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [userInfo, hasPermission]);

  const startContainer = useCallback(async (nodeId: string, ctId: string) => {
    try {
      if (!hasPermission(`/vms/${ctId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to start containers');
      }
      await window.electronAPI.startContainer(nodeId, ctId);
      await fetchClusterResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [hasPermission, fetchClusterResources]);

  const stopContainer = useCallback(async (nodeId: string, ctId: string) => {
    try {
      if (!hasPermission(`/vms/${ctId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to stop containers');
      }
      await window.electronAPI.stopContainer(nodeId, ctId);
      await fetchClusterResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [hasPermission, fetchClusterResources]);

  // Storage Management
  const getStorage = useCallback(async (nodeId?: string): Promise<ProxmoxStorage[]> => {
    try {
      if (nodeId && !hasPermission(`/nodes/${nodeId}`, 'Datastore.Audit')) {
        throw new Error('Insufficient permissions to view storage');
      }
      return await window.electronAPI.getStorage(nodeId);
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [hasPermission]);

  const getStorageContent = useCallback(async (nodeId: string, storage: string, content?: string) => {
    try {
      if (!hasPermission(`/storage/${storage}`, 'Datastore.Audit')) {
        throw new Error('Insufficient permissions to view storage content');
      }
      return await window.electronAPI.getStorageContent(nodeId, storage, content);
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [hasPermission]);

  // Backup Management
  const createBackup = useCallback(async (nodeId: string, vmid: string, options: any) => {
    try {
      if (!hasPermission(`/vms/${vmid}`, 'VM.Backup')) {
        throw new Error('Insufficient permissions to create backups');
      }
      return await window.electronAPI.createBackup(nodeId, vmid, options);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  const createBackupJob = useCallback(async (job: any) => {
    try {
      if (!hasPermission('/cluster/backup', 'Sys.Modify')) {
        throw new Error('Insufficient permissions to create backup jobs');
      }
      return await window.electronAPI.createBackupJob(job);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  // Network Management
  const getNetworkConfig = useCallback(async (nodeId: string) => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'Sys.Audit')) {
        throw new Error('Insufficient permissions to view network configuration');
      }
      return await window.electronAPI.getNetworkConfig(nodeId);
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [hasPermission]);

  const updateNetworkConfig = useCallback(async (nodeId: string, iface: string, config: any) => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'Sys.Modify')) {
        throw new Error('Insufficient permissions to modify network configuration');
      }
      return await window.electronAPI.updateNetworkConfig(nodeId, iface, config);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  // User Management
  const getUsers = useCallback(async () => {
    try {
      if (!hasPermission('/access/users', 'User.Modify')) {
        throw new Error('Insufficient permissions to view users');
      }
      return await window.electronAPI.getUsers();
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [hasPermission]);

  const createUser = useCallback(async (user: any) => {
    try {
      if (!hasPermission('/access/users', 'User.Modify')) {
        throw new Error('Insufficient permissions to create users');
      }
      return await window.electronAPI.createUser(user);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  const updateUser = useCallback(async (userid: string, user: any) => {
    try {
      if (!hasPermission('/access/users', 'User.Modify')) {
        throw new Error('Insufficient permissions to modify users');
      }
      return await window.electronAPI.updateUser(userid, user);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  const deleteUser = useCallback(async (userid: string) => {
    try {
      if (!hasPermission('/access/users', 'User.Modify')) {
        throw new Error('Insufficient permissions to delete users');
      }
      return await window.electronAPI.deleteUser(userid);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [hasPermission]);

  // Statistics
  const getNodeStats = useCallback(async (nodeId: string, timeframe: string = 'hour') => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'Sys.Audit')) {
        throw new Error('Insufficient permissions to view node statistics');
      }
      return await window.electronAPI.getNodeStats(nodeId, timeframe);
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [hasPermission]);

  const getVMStats = useCallback(async (nodeId: string, vmId: string, timeframe: string = 'hour') => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.Audit')) {
        throw new Error('Insufficient permissions to view VM statistics');
      }
      return await window.electronAPI.getVMStats(nodeId, vmId, timeframe);
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [hasPermission]);

  const getContainerStats = useCallback(async (nodeId: string, ctId: string, timeframe: string = 'hour') => {
    try {
      if (!hasPermission(`/vms/${ctId}`, 'VM.Audit')) {
        throw new Error('Insufficient permissions to view container statistics');
      }
      return await window.electronAPI.getContainerStats(nodeId, ctId, timeframe);
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [hasPermission]);

  // Initialize user info on mount
  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  return {
    // State
    nodes,
    clusterResources,
    userInfo,
    tasks,
    backupJobs,
    replicationJobs,
    loading,
    error,

    // Utility functions
    hasPermission,
    getUserInfo,

    // Data fetching
    fetchNodes,
    fetchClusterResources,
    fetchTasks,
    fetchBackupJobs,
    fetchReplicationJobs,

    // VM Management
    getVMs,
    getFilteredVMs,
    getVMConfig,
    updateVMConfig,
    createVM,
    deleteVM,
    startVM,
    stopVM,
    rebootVM,
    suspendVM,
    resumeVM,
    shutdownVM,
    resetVM,
    migrateVM,
    cloneVM,

    // Container Management
    getContainers,
    getFilteredContainers,
    startContainer,
    stopContainer,

    // Storage Management
    getStorage,
    getStorageContent,

    // Backup Management
    createBackup,
    createBackupJob,

    // Network Management
    getNetworkConfig,
    updateNetworkConfig,

    // User Management
    getUsers,
    createUser,
    updateUser,
    deleteUser,

    // Statistics
    getNodeStats,
    getVMStats,
    getContainerStats,
  };
};