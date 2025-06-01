// src/renderer/types/proxmox.ts
export interface ProxmoxNode {
  node: string;
  status: 'online' | 'offline';
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  level: string;
  id: string;
  type: string;
}

export interface ProxmoxVM {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'suspended';
  cpu: number;
  cpus: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  node: string;
  template?: boolean;
}

export interface ProxmoxContainer {
  vmid: number;
  name: string;
  status: 'running' | 'stopped';
  cpu: number;
  cpus: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  node: string;
  template?: boolean;
}

export interface ProxmoxStorage {
  storage: string;
  type: string;
  content: string;
  enabled: boolean;
  used: number;
  total: number;
  avail: number;
  shared: boolean;
}

export interface ProxmoxBackup {
  vmid: number;
  node: string;
  starttime: number;
  endtime: number;
  type: string;
  status: string;
  size: number;
}

export interface ClusterResource {
  id: string;
  type: 'node' | 'vm' | 'storage' | 'lxc';
  node?: string;
  vmid?: number;
  status: string;
  cpu?: number;
  maxcpu?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
}