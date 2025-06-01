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

export class ProxmoxAPI {
  private client: AxiosInstance;
  private ticket: string | null = null;
  private csrfToken: string | null = null;

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
    } catch (error) {
      throw new Error('Authentication failed: ' + (error as Error).message);
    }
  }

  async getNodes(): Promise<any[]> {
    const response = await this.client.get('/nodes');
    return response.data.data;
  }

  async getNodeStatus(nodeId: string): Promise<any> {
    const response = await this.client.get(`/nodes/${nodeId}/status`);
    return response.data.data;
  }

  async getVMs(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/qemu`);
    return response.data.data;
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

  async getContainers(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/lxc`);
    return response.data.data;
  }

  async startContainer(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/status/start`);
    return response.data;
  }

  async stopContainer(nodeId: string, ctId: string): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/lxc/${ctId}/status/stop`);
    return response.data;
  }

  async getStorage(nodeId: string): Promise<any[]> {
    const response = await this.client.get(`/nodes/${nodeId}/storage`);
    return response.data.data;
  }

  async getBackups(): Promise<any[]> {
    const response = await this.client.get('/cluster/backup');
    return response.data.data;
  }

  async createBackup(nodeId: string, vmId: string, options: any): Promise<any> {
    const response = await this.client.post(`/nodes/${nodeId}/vzdump`, {
      vmid: vmId,
      ...options,
    });
    return response.data;
  }

  async getClusterStatus(): Promise<any> {
    const response = await this.client.get('/cluster/status');
    return response.data.data;
  }

  async getClusterResources(): Promise<any[]> {
    const response = await this.client.get('/cluster/resources');
    return response.data.data;
  }
}