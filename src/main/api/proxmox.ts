// src/main/api/proxmox.ts
import axios, { AxiosInstance } from 'axios';
import https from 'https';

export interface ProxmoxConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  realm: string;
  ignoreSSL: boolean;
}

export interface UserPermissions {
  [path: string]: string[];
}

export interface ProxmoxUserInfo {
  userid: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  groups?: string[];
  enable: boolean;
  expire?: number;
  comment?: string;
  realm: string;
  permissions: UserPermissions;
}

export class ProxmoxAPI {
  private client: AxiosInstance;
  private ticket: string | null = null;
  private csrfToken: string | null = null;
  private username: string | null = null;
  private userInfo: ProxmoxUserInfo | null = null;

  constructor(private config: ProxmoxConfig) {
    this.client = axios.create({
      baseURL: `https://${config.host}:${config.port}/api2/json`,
      httpsAgent: new https.Agent({
        rejectUnauthorized: !config.ignoreSSL,
      }),
      timeout: 30000,
    });

    this.client.interceptors.request.use((config) => {
      if (this.ticket && this.csrfToken) {
        config.headers.Cookie = `PVEAuthCookie=${this.ticket}`;
        config.headers.CSRFPreventionToken = this.csrfToken;
      }
      return config;
    });
  }

  async authenticate(): Promise<void> {
    try {
      const response = await this.client.post('/access/ticket', {
        username: `${this.config.username}@${this.config.realm}`,
        password: this.config.password,
      });

      this.ticket = response.data.data.ticket;
      this.csrfToken = response.data.data.CSRFPreventionToken;
      this.username = response.data.data.username;

      // Fetch user information and permissions
      await this.fetchUserInfo();
    } catch (error) {
      throw new Error('Authentication failed: ' + (error as Error).message);
    }
  }

  private async fetchUserInfo(): Promise<void> {
    try {
      const userResponse = await this.client.get(`/access/users/${this.username}`);
      const permResponse = await this.client.get('/access/permissions');
      
      this.userInfo = {
        ...userResponse.data.data,
        permissions: permResponse.data.data
      };
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  // Permission checking
  hasPermission(path: string, privilege: string): boolean {
    if (!this.userInfo) return false;
    
    // Root user has all permissions
    if (this.userInfo.userid.startsWith('root@')) return true;
    
    // Check specific path permissions
    const pathPerms = this.userInfo.permissions[path];
    if (pathPerms && pathPerms.includes(privilege)) return true;
    
    // Check parent path permissions
    const pathParts = path.split('/');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('/');
      const parentPerms = this.userInfo.permissions[parentPath];
      if (parentPerms && parentPerms.includes(privilege)) return true;
    }
    
    return false;
  }

  getUserInfo(): ProxmoxUserInfo | null {
    return this.userInfo;
  }

  // ========== CLUSTER MANAGEMENT ==========
  async getClusterStatus(): Promise<any> {
    const response = await this.client.get('/cluster/status');
    return response.data.data;
  }

  async getClusterResources(): Promise<any[]> {
    const response = await this.client.get('/cluster/resources');
    return response.data.data;
  }

  async getClusterConfig(): Promise<any> {
    const response = await this.client.get('/cluster/config');
    return response.data.data;
  }

  async getClusterOptions(): Promise<any> {
    const response = await this.client.get('/cluster/options');
    return response.data.data;
  }

  async updateClusterOptions(options: any): Promise<any> {
    const response = await this.client.put('/cluster/options', options);
    return response.data;
  }

  // ========== NODE MANAGEMENT ==========
  async getNodes(): Promise<any[]> {
    const response = await this.client.get('/nodes');
    return response.data.data;
  }

  async getNodeStatus(nodeId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/status`);
    return response.data.data;
  }

  async getNodeVersion(nodeId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/version`);
    return response.data.data;
  }

  async getNodeTime(nodeId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/time`);
    return response.data.data;
  }

  async getNodeDNS(nodeId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/dns`);
    return response.data.data;
  }

  async updateNodeDNS(nodeId: string, dns: any): Promise<any> {
    const response = await this.client.put(`/nodes/${nodeId}/dns`, dns);
    return response.data;
  }

  async getNodeHosts(nodeId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/hosts`);
    return response.data.data;
  }

  async updateNodeHosts(nodeId: string, hosts: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/hosts`, { data: hosts });
    return response.data;
  }

  // ========== VM MANAGEMENT ==========
  async getVMs(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/qemu`);
    return response.data.data;
  }

  async getVMStatus(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/qemu/${vmId}/status/current`);
    return response.data.data;
  }

  async getVMConfig(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/qemu/${vmId}/config`);
    return response.data.data;
  }

  async updateVMConfig(nodeId: string, vmId: string, config: any): Promise<any> {
    const response = await this.client.put(`/nodes/${nodeId}/qemu/${vmId}/config`, config);
    return response.data;
  }

  async createVM(nodeId: string, config: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu`, config);
    return response.data;
  }

  async deleteVM(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.delete(`/nodes/${nodeId}/qemu/${vmId}`);
    return response.data;
  }

  async startVM(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/status/start`);
    return response.data;
  }

  async stopVM(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/status/stop`);
    return response.data;
  }

  async rebootVM(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/status/reboot`);
    return response.data;
  }

  async suspendVM(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/status/suspend`);
    return response.data;
  }

  async resumeVM(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/status/resume`);
    return response.data;
  }

  async resetVM(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/status/reset`);
    return response.data;
  }

  async shutdownVM(nodeId: string, vmId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/status/shutdown`);
    return response.data;
  }

  async migrateVM(nodeId: string, vmId: string, target: string, options?: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/migrate`, {
      target,
      ...options
    });
    return response.data;
  }

  async cloneVM(nodeId: string, vmId: string, newid: string, options?: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/clone`, {
      newid,
      ...options
    });
    return response.data;
  }

  async getVMSnapshots(nodeId: string, vmId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/qemu/${vmId}/snapshot`);
    return response.data.data;
  }

  async createVMSnapshot(nodeId: string, vmId: string, snapname: string, description?: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/snapshot`, {
      snapname,
      description
    });
    return response.data;
  }

  async deleteVMSnapshot(nodeId: string, vmId: string, snapname: string): Promise<any> {
    const response = await this.client.delete(`/nodes/${nodeId}/qemu/${vmId}/snapshot/${snapname}`);
    return response.data;
  }

  async rollbackVMSnapshot(nodeId: string, vmId: string, snapname: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/qemu/${vmId}/snapshot/${snapname}/rollback`);
    return response.data;
  }

  // ========== CONTAINER MANAGEMENT ==========
  async getContainers(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/lxc`);
    return response.data.data;
  }

  async getContainerStatus(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/lxc/${ctId}/status/current`);
    return response.data.data;
  }

  async getContainerConfig(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/lxc/${ctId}/config`);
    return response.data.data;
  }

  async updateContainerConfig(nodeId: string, ctId: string, config: any): Promise<any> {
    const response = await this.client.put(`/nodes/${nodeId}/lxc/${ctId}/config`, config);
    return response.data;
  }

  async createContainer(nodeId: string, config: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc`, config);
    return response.data;
  }

  async deleteContainer(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.delete(`/nodes/${nodeId}/lxc/${ctId}`);
    return response.data;
  }

  async startContainer(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/status/start`);
    return response.data;
  }

  async stopContainer(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/status/stop`);
    return response.data;
  }

  async rebootContainer(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/status/reboot`);
    return response.data;
  }

  async suspendContainer(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/status/suspend`);
    return response.data;
  }

  async resumeContainer(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/status/resume`);
    return response.data;
  }

  async shutdownContainer(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/status/shutdown`);
    return response.data;
  }

  async migrateContainer(nodeId: string, ctId: string, target: string, options?: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/migrate`, {
      target,
      ...options
    });
    return response.data;
  }

  async cloneContainer(nodeId: string, ctId: string, newid: string, options?: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/clone`, {
      newid,
      ...options
    });
    return response.data;
  }

  async getContainerSnapshots(nodeId: string, ctId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/lxc/${ctId}/snapshot`);
    return response.data.data;
  }

  async createContainerSnapshot(nodeId: string, ctId: string, snapname: string, description?: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/snapshot`, {
      snapname,
      description
    });
    return response.data;
  }

  // ========== STORAGE MANAGEMENT ==========
  async getStorage(nodeId?: string): Promise<any[]> {
    const endpoint = nodeId ? `/nodes/${nodeId}/storage` : '/storage';
    const response = await this.client.get(endpoint);
    return response.data.data;
  }

  async getStorageContent(nodeId: string, storage: string, content?: string): Promise<any[]> {
    const params = content ? { content } : {};
    const response = await this.client.get(`/nodes/${nodeId}/storage/${storage}/content`, { params });
    return response.data.data;
  }

  async uploadToStorage(nodeId: string, storage: string, file: FormData): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/storage/${storage}/upload`, file, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async deleteStorageContent(nodeId: string, storage: string, volume: string): Promise<any> {
    const response = await this.client.delete(`/nodes/${nodeId}/storage/${storage}/content/${volume}`);
    return response.data;
  }

  // ========== BACKUP MANAGEMENT ==========
  async getBackups(): Promise<any[]> {
    const response = await this.client.get('/cluster/backup');
    return response.data.data;
  }

  async createBackup(nodeId: string, vmid: string, options: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/vzdump`, {
      vmid,
      ...options,
    });
    return response.data;
  }

  async getBackupJobs(): Promise<any[]> {
    const response = await this.client.get('/cluster/backup');
    return response.data.data;
  }

  async createBackupJob(job: any): Promise<any> {
    const response = await this.client.post('/cluster/backup', job);
    return response.data;
  }

  async updateBackupJob(id: string, job: any): Promise<any> {
    const response = await this.client.put(`/cluster/backup/${id}`, job);
    return response.data;
  }

  async deleteBackupJob(id: string): Promise<any> {
    const response = await this.client.delete(`/cluster/backup/${id}`);
    return response.data;
  }

  // ========== NETWORK MANAGEMENT ==========
  async getNetworkConfig(nodeId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/network`);
    return response.data.data;
  }

  async updateNetworkConfig(nodeId: string, iface: string, config: any): Promise<any> {
    const response = await this.client.put(`/nodes/${nodeId}/network/${iface}`, config);
    return response.data;
  }

  async createNetworkInterface(nodeId: string, config: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/network`, config);
    return response.data;
  }

  async deleteNetworkInterface(nodeId: string, iface: string): Promise<any> {
    const response = await this.client.delete(`/nodes/${nodeId}/network/${iface}`);
    return response.data;
  }

  async applyNetworkConfig(nodeId: string): Promise<any> {
    const response = await this.client.put(`/nodes/${nodeId}/network`);
    return response.data;
  }

  async revertNetworkConfig(nodeId: string): Promise<any> {
    const response = await this.client.delete(`/nodes/${nodeId}/network`);
    return response.data;
  }

  // ========== FIREWALL MANAGEMENT ==========
  async getFirewallGroups(): Promise<any[]> {
    const response = await this.client.get('/cluster/firewall/groups');
    return response.data.data;
  }

  async getFirewallRules(nodeId?: string, vmId?: string): Promise<any[]> {
    let endpoint = '/cluster/firewall/rules';
    if (nodeId && vmId) {
      endpoint = `/nodes/${nodeId}/qemu/${vmId}/firewall/rules`;
    } else if (nodeId) {
      endpoint = `/nodes/${nodeId}/firewall/rules`;
    }
    const response = await this.client.get(endpoint);
    return response.data.data;
  }

  async createFirewallRule(rule: any, nodeId?: string, vmId?: string): Promise<any> {
    let endpoint = '/cluster/firewall/rules';
    if (nodeId && vmId) {
      endpoint = `/nodes/${nodeId}/qemu/${vmId}/firewall/rules`;
    } else if (nodeId) {
      endpoint = `/nodes/${nodeId}/firewall/rules`;
    }
    const response = await this.client.post(endpoint, rule);
    return response.data;
  }

  // ========== USER & ACCESS MANAGEMENT ==========
  async getUsers(): Promise<any[]> {
    const response = await this.client.get('/access/users');
    return response.data.data;
  }

  async createUser(user: any): Promise<any> {
    const response = await this.client.post('/access/users', user);
    return response.data;
  }

  async updateUser(userid: string, user: any): Promise<any> {
    const response = await this.client.put(`/access/users/${userid}`, user);
    return response.data;
  }

  async deleteUser(userid: string): Promise<any> {
    const response = await this.client.delete(`/access/users/${userid}`);
    return response.data;
  }

  async getGroups(): Promise<any[]> {
    const response = await this.client.get('/access/groups');
    return response.data.data;
  }

  async createGroup(group: any): Promise<any> {
    const response = await this.client.post('/access/groups', group);
    return response.data;
  }

  async updateGroup(groupid: string, group: any): Promise<any> {
    const response = await this.client.put(`/access/groups/${groupid}`, group);
    return response.data;
  }

  async deleteGroup(groupid: string): Promise<any> {
    const response = await this.client.delete(`/access/groups/${groupid}`);
    return response.data;
  }

  async getRoles(): Promise<any[]> {
    const response = await this.client.get('/access/roles');
    return response.data.data;
  }

  async getACL(): Promise<any[]> {
    const response = await this.client.get('/access/acl');
    return response.data.data;
  }

  async updateACL(acl: any): Promise<any> {
    const response = await this.client.put('/access/acl', acl);
    return response.data;
  }

  // ========== MONITORING & STATISTICS ==========
  async getNodeStats(nodeId: string, timeframe: string = 'hour'): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/rrddata`, {
      params: { timeframe }
    });
    return response.data.data;
  }

  async getVMStats(nodeId: string, vmId: string, timeframe: string = 'hour'): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/qemu/${vmId}/rrddata`, {
      params: { timeframe }
    });
    return response.data.data;
  }

  async getContainerStats(nodeId: string, ctId: string, timeframe: string = 'hour'): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/lxc/${ctId}/rrddata`, {
      params: { timeframe }
    });
    return response.data.data;
  }

  async getStorageStats(nodeId: string, storage: string, timeframe: string = 'hour'): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/storage/${storage}/rrddata`, {
      params: { timeframe }
    });
    return response.data.data;
  }

  // ========== TASKS MANAGEMENT ==========
  async getTasks(nodeId?: string): Promise<any[]> {
    const endpoint = nodeId ? `/nodes/${nodeId}/tasks` : '/cluster/tasks';
    const response = await this.client.get(endpoint);
    return response.data.data;
  }

  async getTaskStatus(nodeId: string, upid: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/tasks/${upid}/status`);
    return response.data.data;
  }

  async getTaskLog(nodeId: string, upid: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/tasks/${upid}/log`);
    return response.data.data;
  }

  async stopTask(nodeId: string, upid: string): Promise<any> {
    const response = await this.client.delete(`/nodes/${nodeId}/tasks/${upid}`);
    return response.data;
  }

  // ========== POOL MANAGEMENT ==========
  async getPools(): Promise<any[]> {
    const response = await this.client.get('/pools');
    return response.data.data;
  }

  async createPool(pool: any): Promise<any> {
    const response = await this.client.post('/pools', pool);
    return response.data;
  }

  async updatePool(poolid: string, pool: any): Promise<any> {
    const response = await this.client.put(`/pools/${poolid}`, pool);
    return response.data;
  }

  async deletePool(poolid: string): Promise<any> {
    const response = await this.client.delete(`/pools/${poolid}`);
    return response.data;
  }

  // ========== TEMPLATE MANAGEMENT ==========
  async getTemplates(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/aplinfo`);
    return response.data.data;
  }

  async downloadTemplate(nodeId: string, template: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/aplinfo`, { template });
    return response.data;
  }

  // ========== CERTIFICATE MANAGEMENT ==========
  async getCertificates(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/certificates`);
    return response.data.data;
  }

  async uploadCertificate(nodeId: string, cert: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/certificates/custom`, cert);
    return response.data;
  }

  // ========== REPLICATION MANAGEMENT ==========
  async getReplicationJobs(): Promise<any[]> {
    const response = await this.client.get('/cluster/replication');
    return response.data.data;
  }

  async createReplicationJob(job: any): Promise<any> {
    const response = await this.client.post('/cluster/replication', job);
    return response.data;
  }

  async updateReplicationJob(id: string, job: any): Promise<any> {
    const response = await this.client.put(`/cluster/replication/${id}`, job);
    return response.data;
  }

  async deleteReplicationJob(id: string): Promise<any> {
    const response = await this.client.delete(`/cluster/replication/${id}`);
    return response.data;
  }

  // ========== CEPH MANAGEMENT ==========
  async getCephStatus(nodeId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/ceph/status`);
    return response.data.data;
  }

  async getCephOSDs(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/ceph/osd`);
    return response.data.data;
  }

  async getCephMONs(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/ceph/mon`);
    return response.data.data;
  }

  async getCephPools(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/ceph/pools`);
    return response.data.data;
  }

  // ========== HA MANAGEMENT ==========
  async getHAResources(): Promise<any[]> {
    const response = await this.client.get('/cluster/ha/resources');
    return response.data.data;
  }

  async getHAGroups(): Promise<any[]> {
    const response = await this.client.get('/cluster/ha/groups');
    return response.data.data;
  }

  async getHAStatus(): Promise<any> {
    const response = await this.client.get('/cluster/ha/status/current');
    return response.data.data;
  }

  async createHAResource(resource: any): Promise<any> {
    const response = await this.client.post('/cluster/ha/resources', resource);
    return response.data;
  }

  // Helper method to get filtered resources based on user permissions
  async getFilteredVMs(nodeId: string): Promise<any[]> {
    const allVMs = await this.getVMs(nodeId);
    
    if (!this.userInfo || this.userInfo.userid.startsWith('root@')) {
      return allVMs;
    }

    // Filter VMs based on user permissions
    return allVMs.filter(vm => 
      this.hasPermission(`/vms/${vm.vmid}`, 'VM.Audit') ||
      this.hasPermission(`/nodes/${nodeId}`, 'VM.Audit')
    );
  }

  async getFilteredContainers(nodeId: string): Promise<any[]> {
    const allContainers = await this.getContainers(nodeId);
    
    if (!this.userInfo || this.userInfo.userid.startsWith('root@')) {
      return allContainers;
    }

    // Filter containers based on user permissions
    return allContainers.filter(ct => 
      this.hasPermission(`/vms/${ct.vmid}`, 'VM.Audit') ||
      this.hasPermission(`/nodes/${nodeId}`, 'VM.Audit')
    );
  }
}