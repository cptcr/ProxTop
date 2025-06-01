import { useState, useEffect, useCallback } from 'react';
import { ProxmoxNode, ProxmoxVM, ProxmoxContainer, ProxmoxStorage, ClusterResource } from '../types/proxmox';

export const useProxmox = () => {
  const [nodes, setNodes] = useState<ProxmoxNode[]>([]);
  const [clusterResources, setClusterResources] = useState<ClusterResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const getVMs = useCallback(async (nodeId: string): Promise<ProxmoxVM[]> => {
    try {
      return await window.electronAPI.getVMs(nodeId);
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, []);

  const getContainers = useCallback(async (nodeId: string): Promise<ProxmoxContainer[]> => {
    try {
      return await window.electronAPI.getContainers(nodeId);
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, []);

  const getStorage = useCallback(async (nodeId: string): Promise<ProxmoxStorage[]> => {
    try {
      return await window.electronAPI.getStorage(nodeId);
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, []);

  const startVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      await window.electronAPI.startVM(nodeId, vmId);
      await fetchClusterResources(); // Refresh data
    } catch (err) {
      setError((err as Error).message);
    }
  }, [fetchClusterResources]);

  const stopVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      await window.electronAPI.stopVM(nodeId, vmId);
      await fetchClusterResources(); // Refresh data
    } catch (err) {
      setError((err as Error).message);
    }
  }, [fetchClusterResources]);

  const rebootVM = useCallback(async (nodeId: string, vmId: string) => {
    try {
      await window.electronAPI.rebootVM(nodeId, vmId);
      await fetchClusterResources(); // Refresh data
    } catch (err) {
      setError((err as Error).message);
    }
  }, [fetchClusterResources]);

  const startContainer = useCallback(async (nodeId: string, ctId: string) => {
    try {
      await window.electronAPI.startContainer(nodeId, ctId);
      await fetchClusterResources(); // Refresh data
    } catch (err) {
      setError((err as Error).message);
    }
  }, [fetchClusterResources]);

  const stopContainer = useCallback(async (nodeId: string, ctId: string) => {
    try {
      await window.electronAPI.stopContainer(nodeId, ctId);
      await fetchClusterResources(); // Refresh data
    } catch (err) {
      setError((err as Error).message);
    }
  }, [fetchClusterResources]);

  return {
    nodes,
    clusterResources,
    loading,
    error,
    fetchNodes,
    fetchClusterResources,
    getVMs,
    getContainers,
    getStorage,
    startVM,
    stopVM,
    rebootVM,
    startContainer,
    stopContainer,
  };
};