import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { ProxmoxAPI } from './api/proxmox';

class ProxmoxDesktopApp {
  private mainWindow: BrowserWindow | null = null;
  private proxmoxAPI: ProxmoxAPI | null = null;

  constructor() {
    app.whenReady().then(() => this.createWindow());
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit();
    });
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
    });

    this.setupIPC();
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hiddenInset',
      show: false,
    });

    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:8080');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.createMenu();
  }

  private createMenu(): void {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Connect to Proxmox',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.mainWindow?.webContents.send('menu-connect'),
          },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }

  private setupIPC(): void {
    // Connection management
    ipcMain.handle('proxmox:connect', async (_, config) => {
      try {
        this.proxmoxAPI = new ProxmoxAPI(config);
        await this.proxmoxAPI.authenticate();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('proxmox:disconnect', async () => {
      this.proxmoxAPI = null;
      return { success: true };
    });

    // Node operations
    ipcMain.handle('proxmox:getNodes', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodes();
    });

    ipcMain.handle('proxmox:getNodeStatus', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodeStatus(nodeId);
    });

    // VM operations
    ipcMain.handle('proxmox:getVMs', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getVMs(nodeId);
    });

    ipcMain.handle('proxmox:startVM', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.startVM(nodeId, vmId);
    });

    ipcMain.handle('proxmox:stopVM', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.stopVM(nodeId, vmId);
    });

    ipcMain.handle('proxmox:rebootVM', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.rebootVM(nodeId, vmId);
    });

    // Container operations
    ipcMain.handle('proxmox:getContainers', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getContainers(nodeId);
    });

    ipcMain.handle('proxmox:startContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.startContainer(nodeId, ctId);
    });

    ipcMain.handle('proxmox:stopContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.stopContainer(nodeId, ctId);
    });

    // Storage operations
    ipcMain.handle('proxmox:getStorage', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getStorage(nodeId);
    });

    // Backup operations
    ipcMain.handle('proxmox:getBackups', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getBackups();
    });

    ipcMain.handle('proxmox:createBackup', async (_, nodeId, vmId, options) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createBackup(nodeId, vmId, options);
    });

    // Cluster operations
    ipcMain.handle('proxmox:getClusterStatus', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getClusterStatus();
    });

    ipcMain.handle('proxmox:getClusterResources', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getClusterResources();
    });
  }
}

new ProxmoxDesktopApp();