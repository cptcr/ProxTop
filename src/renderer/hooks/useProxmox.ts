// src/renderer/hooks/useProxmox.ts - Fixed with proper export and types
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

  // API call wrapper with error handling
  const apiCall = useCallback(async <T>(
    operation: () => Promise<T>,
    errorContext: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(`${errorContext}: ${errorMessage}`);
      console.error(`${errorContext}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user information
  const getUserInfo = useCallback(async (): Promise<UserInfo | null> => {
    const result = await apiCall(
      () => window.electronAPI.getUserInfo(),
      'Fetch user info'
    );
    if (result) {
      setUserInfo(result);
    }
    return result;
  }, [apiCall]);

  // Main data fetching functions
  const fetchNodes = useCallback(async (): Promise<ProxmoxNode[]> => {
    const result = await apiCall(
      () => window.electronAPI.getNodes(),
      'Fetch nodes'
    );
    
    if (result) {
      setNodes(result);
      return result;
    }
    return [];
  }, [apiCall]);

  const fetchClusterResources = useCallback(async (): Promise<ClusterResource[]> => {
    const result = await apiCall(
      () => window.electronAPI.getClusterResources(),
      'Fetch cluster resources'
    );
    
    if (result) {
      setClusterResources(result);
      return result;
    }
    return [];
  }, [apiCall]);

  // VM Management
  const getVMs = useCallback(async (nodeId: string): Promise<ProxmoxVM[]> => {
    const result = await apiCall(
      () => window.electronAPI.getVMs(nodeId),
      `Fetch VMs for node ${nodeId}`
    );
    return result || [];
  }, [apiCall]);

  const startVM = useCallback(async (nodeId: string, vmId: string): Promise<void> => {
    await apiCall(
      () => window.electronAPI.startVM(nodeId, vmId),
      `Start VM ${vmId}`
    );
  }, [apiCall]);

  const stopVM = useCallback(async (nodeId: string, vmId: string): Promise<void> => {
    await apiCall(
      () => window.electronAPI.stopVM(nodeId, vmId),
      `Stop VM ${vmId}`
    );
  }, [apiCall]);

  const rebootVM = useCallback(async (nodeId: string, vmId: string): Promise<void> => {
    await apiCall(
      () => window.electronAPI.rebootVM(nodeId, vmId),
      `Reboot VM ${vmId}`
    );
  }, [apiCall]);

  const suspendVM = useCallback(async (nodeId: string, vmId: string): Promise<void> => {
    await apiCall(
      () => window.electronAPI.suspendVM(nodeId, vmId),
      `Suspend VM ${vmId}`
    );
  }, [apiCall]);

  const resumeVM = useCallback(async (nodeId: string, vmId: string): Promise<void> => {
    await apiCall(
      () => window.electronAPI.resumeVM(nodeId, vmId),
      `Resume VM ${vmId}`
    );
  }, [apiCall]);

  const shutdownVM = useCallback(async (nodeId: string, vmId: string): Promise<void> => {
    await apiCall(
      () => window.electronAPI.shutdownVM(nodeId, vmId),
      `Shutdown VM ${vmId}`
    );
  }, [apiCall]);

  const resetVM = useCallback(async (nodeId: string, vmId: string): Promise<void> => {
    await apiCall(
      () => window.electronAPI.resetVM(nodeId, vmId),
      `Reset VM ${vmId}`
    );
  }, [apiCall]);

  // Container Management
  const getContainers = useCallback(async (nodeId: string): Promise<ProxmoxContainer[]> => {
    const result = await apiCall(
      () => window.electronAPI.getContainers(nodeId),
      `Fetch containers for node ${nodeId}`
    );
    return result || [];
  }, [apiCall]);

  const startContainer = useCallback(async (nodeId: string, ctId: string): Promise<void> => {
    await apiCall(
      () => window.electronAPI.startContainer(nodeId, ctId),
      `Start container ${ctId}`
    );
  }, [apiCall]);

  const stopContainer = useCallback(async (nodeId: string, ctId: string): Promise<void> => {
    await apiCall(
      () => window.electronAPI.stopContainer(nodeId, ctId),
      `Stop container ${ctId}`
    );
  }, [apiCall]);

  // Storage Management
  const getStorage = useCallback(async (nodeId?: string): Promise<ProxmoxStorage[]> => {
    const result = await apiCall(
      () => window.electronAPI.getStorage(nodeId),
      `Fetch storage${nodeId ? ` for node ${nodeId}` : ''}`
    );
    return result || [];
  }, [apiCall]);

  const getStorageContent = useCallback(async (nodeId: string, storage: string, content?: string) => {
    const result = await apiCall(
      () => window.electronAPI.getStorageContent(nodeId, storage, content),
      `Fetch storage content for ${storage}`
    );
    return result || [];
  }, [apiCall]);

  // Network Management
  const getNetworkConfig = useCallback(async (nodeId: string) => {
    const result = await apiCall(
      () => window.electronAPI.getNetworkConfig(nodeId),
      `Fetch network config for node ${nodeId}`
    );
    return result;
  }, [apiCall]);

  // User Management
  const getUsers = useCallback(async () => {
    const result = await apiCall(
      () => window.electronAPI.getUsers(),
      'Fetch users'
    );
    return result || [];
  }, [apiCall]);

  const createUser = useCallback(async (user: any) => {
    const result = await apiCall(
      () => window.electronAPI.createUser(user),
      'Create user'
    );
    return result;
  }, [apiCall]);

  // Statistics
  const getNodeStats = useCallback(async (nodeId: string, timeframe: string = 'hour') => {
    const result = await apiCall(
      () => window.electronAPI.getNodeStats(nodeId, timeframe),
      `Fetch node stats for ${nodeId}`
    );
    return result;
  }, [apiCall]);

  const getVMStats = useCallback(async (nodeId: string, vmId: string, timeframe: string = 'hour') => {
    const result = await apiCall(
      () => window.electronAPI.getVMStats(nodeId, vmId, timeframe),
      `Fetch VM stats for ${vmId}`
    );
    return result;
  }, [apiCall]);

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