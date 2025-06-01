// src/renderer/hooks/useProxmox.ts - Clean hook with real Proxmox data only
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

export const useProxmox = () => {
  const [nodes, setNodes] = useState<ProxmoxNode[]>([]);
  const [clusterResources, setClusterResources] = useState<ClusterResource[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
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
      setNodes(nodeData || []);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch nodes:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClusterResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resources = await window.electronAPI.getClusterResources();
      setClusterResources(resources || []);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch cluster resources:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // VM Management
  const getVMs = useCallback(async (nodeId: string): Promise<ProxmoxVM[]> => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'VM.Audit')) {
        throw new Error('Insufficient permissions to view VMs');
      }
      const vms = await window.electronAPI.getVMs(nodeId);
      return vms || [];
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch VMs:', errorMessage);
      return [];
    }
  }, [hasPermission]);

  const startVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to start VMs');
      }
      await window.electronAPI.startVM(nodeId, vmId);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to start VM:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  const stopVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to stop VMs');
      }
      await window.electronAPI.stopVM(nodeId, vmId);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to stop VM:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  const rebootVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to reboot VMs');
      }
      await window.electronAPI.rebootVM(nodeId, vmId);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to reboot VM:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  const suspendVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to suspend VMs');
      }
      await window.electronAPI.suspendVM(nodeId, vmId);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to suspend VM:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  const resumeVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to resume VMs');
      }
      await window.electronAPI.resumeVM(nodeId, vmId);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to resume VM:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  const shutdownVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to shutdown VMs');
      }
      await window.electronAPI.shutdownVM(nodeId, vmId);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to shutdown VM:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  const resetVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to reset VMs');
      }
      await window.electronAPI.resetVM(nodeId, vmId);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to reset VM:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  // Container Management
  const getContainers = useCallback(async (nodeId: string): Promise<ProxmoxContainer[]> => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'VM.Audit')) {
        throw new Error('Insufficient permissions to view containers');
      }
      const containers = await window.electronAPI.getContainers(nodeId);
      return containers || [];
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch containers:', errorMessage);
      return [];
    }
  }, [hasPermission]);

  const startContainer = useCallback(async (nodeId: string, ctId: string) => {
    try {
      if (!hasPermission(`/vms/${ctId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to start containers');
      }
      await window.electronAPI.startContainer(nodeId, ctId);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to start container:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  const stopContainer = useCallback(async (nodeId: string, ctId: string) => {
    try {
      if (!hasPermission(`/vms/${ctId}`, 'VM.PowerMgmt')) {
        throw new Error('Insufficient permissions to stop containers');
      }
      await window.electronAPI.stopContainer(nodeId, ctId);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to stop container:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  // Storage Management
  const getStorage = useCallback(async (nodeId?: string): Promise<ProxmoxStorage[]> => {
    try {
      if (nodeId && !hasPermission(`/nodes/${nodeId}`, 'Datastore.Audit')) {
        throw new Error('Insufficient permissions to view storage');
      }
      const storage = await window.electronAPI.getStorage(nodeId);
      return storage || [];
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch storage:', errorMessage);
      return [];
    }
  }, [hasPermission]);

  const getStorageContent = useCallback(async (nodeId: string, storage: string, content?: string) => {
    try {
      if (!hasPermission(`/storage/${storage}`, 'Datastore.Audit')) {
        throw new Error('Insufficient permissions to view storage content');
      }
      const storageContent = await window.electronAPI.getStorageContent(nodeId, storage, content);
      return storageContent || [];
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch storage content:', errorMessage);
      return [];
    }
  }, [hasPermission]);

  // Network Management
  const getNetworkConfig = useCallback(async (nodeId: string) => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'Sys.Audit')) {
        throw new Error('Insufficient permissions to view network configuration');
      }
      const networkConfig = await window.electronAPI.getNetworkConfig(nodeId);
      return networkConfig;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch network config:', errorMessage);
      return null;
    }
  }, [hasPermission]);

  // User Management
  const getUsers = useCallback(async () => {
    try {
      if (!hasPermission('/access/users', 'User.Modify')) {
        throw new Error('Insufficient permissions to view users');
      }
      const users = await window.electronAPI.getUsers();
      return users || [];
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch users:', errorMessage);
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
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to create user:', errorMessage);
      throw err;
    }
  }, [hasPermission]);

  // Statistics
  const getNodeStats = useCallback(async (nodeId: string, timeframe: string = 'hour') => {
    try {
      if (!hasPermission(`/nodes/${nodeId}`, 'Sys.Audit')) {
        throw new Error('Insufficient permissions to view node statistics');
      }
      const stats = await window.electronAPI.getNodeStats(nodeId, timeframe);
      return stats;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch node stats:', errorMessage);
      return null;
    }
  }, [hasPermission]);

  const getVMStats = useCallback(async (nodeId: string, vmId: string, timeframe: string = 'hour') => {
    try {
      if (!hasPermission(`/vms/${vmId}`, 'VM.Audit')) {
        throw new Error('Insufficient permissions to view VM statistics');
      }
      const stats = await window.electronAPI.getVMStats(nodeId, vmId, timeframe);
      return stats;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Failed to fetch VM stats:', errorMessage);
      return null;
    }
  }, [hasPermission]);

  // Initialize user info on mount
  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  // Clear error when data changes successfully
  useEffect(() => {
    if (nodes.length > 0 || clusterResources.length > 0) {
      setError(null);
    }
  }, [nodes, clusterResources]);

  return {
    // State
    nodes,
    clusterResources,
    userInfo,
    loading,
    error,

    // Utility functions
    hasPermission,
    getUserInfo,

    // Data fetching
    fetchNodes,
    fetchClusterResources,

    // VM Management
    getVMs,
    startVM,
    stopVM,
    rebootVM,
    suspendVM,
    resumeVM,
    shutdownVM,
    resetVM,

    // Container Management
    getContainers,
    startContainer,
    stopContainer,

    // Storage Management
    getStorage,
    getStorageContent,

    // Network Management
    getNetworkConfig,

    // User Management
    getUsers,
    createUser,

    // Statistics
    getNodeStats,
    getVMStats,
  };
};