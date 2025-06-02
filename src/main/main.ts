// src/main/main.ts - Fixed main process with better error handling
import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { ProxmoxAPI } from './api/proxmox';

// Enhanced GPU crash prevention
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--no-sandbox');
app.disableHardwareAcceleration();

class ProxmoxDesktopApp {
  private mainWindow: BrowserWindow | null = null;
  private proxmoxAPI: ProxmoxAPI | null = null;
  private isQuitting = false;

  constructor() {
    app.whenReady().then(() => {
      this.createWindow();
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.isQuitting = true;
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    this.setupIPC();
  }

  private createWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.destroy();
    }

    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: false, // For development
      },
      show: false,
    });

    // Load the app
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000').catch(() => {
        this.loadBuiltFiles();
      });
      this.mainWindow.webContents.openDevTools();
    } else {
      this.loadBuiltFiles();
    }

    this.mainWindow.once('ready-to-show', () => {
      if (!this.isQuitting && this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.show();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.createMenu();
  }

  private loadBuiltFiles(): void {
    const builtPath = path.join(__dirname, '../../out/index.html');
    this.mainWindow?.loadFile(builtPath).catch(err => {
      console.error('Failed to load built files:', err);
      
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>ProxTop - Error</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: #f5f5f5;
                    color: #333;
                }
                .error-container {
                    background: white;
                    border-radius: 8px;
                    padding: 40px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 500px;
                    margin: 0 auto;
                }
                .error-title { color: #d32f2f; margin-bottom: 20px; }
                .retry-button {
                    background: #1976d2;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1 class="error-title">ProxTop Failed to Load</h1>
                <p>The application failed to load properly. Please check the build.</p>
                <button class="retry-button" onclick="location.reload()">Retry</button>
            </div>
        </body>
        </html>
      `;
      
      this.mainWindow?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    });
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
          { 
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.isQuitting = true;
              app.quit();
            }
          },
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
        console.error('Connection failed:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('proxmox:disconnect', async () => {
      this.proxmoxAPI = null;
      return { success: true };
    });

    ipcMain.handle('proxmox:getUserInfo', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getUserInfo();
    });

    // Cluster management
    ipcMain.handle('proxmox:getClusterStatus', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getClusterStatus();
    });

    ipcMain.handle('proxmox:getClusterResources', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getClusterResources();
    });

    ipcMain.handle('proxmox:getNodes', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodes();
    });

    ipcMain.handle('proxmox:getNodeStatus', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodeStatus(nodeId);
    });

    // VM management
    ipcMain.handle('proxmox:getVMs', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getVMs(nodeId);
    });

    ipcMain.handle('proxmox:getFilteredVMs', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getFilteredVMs(nodeId);
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

    ipcMain.handle('proxmox:suspendVM', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.suspendVM(nodeId, vmId);
    });

    ipcMain.handle('proxmox:resumeVM', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.resumeVM(nodeId, vmId);
    });

    ipcMain.handle('proxmox:shutdownVM', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.shutdownVM(nodeId, vmId);
    });

    // Container management
    ipcMain.handle('proxmox:getContainers', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getContainers(nodeId);
    });

    ipcMain.handle('proxmox:getFilteredContainers', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getFilteredContainers(nodeId);
    });

    ipcMain.handle('proxmox:startContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.startContainer(nodeId, ctId);
    });

    ipcMain.handle('proxmox:stopContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.stopContainer(nodeId, ctId);
    });

    // Storage management
    ipcMain.handle('proxmox:getStorage', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getStorage(nodeId);
    });

    ipcMain.handle('proxmox:getStorageContent', async (_, nodeId, storage, content) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getStorageContent(nodeId, storage, content);
    });

    // Network management
    ipcMain.handle('proxmox:getNetworkConfig', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNetworkConfig(nodeId);
    });

    // User management
    ipcMain.handle('proxmox:getUsers', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getUsers();
    });

    // Statistics
    ipcMain.handle('proxmox:getNodeStats', async (_, nodeId, timeframe) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodeStats(nodeId, timeframe);
    });

    ipcMain.handle('proxmox:getVMStats', async (_, nodeId, vmId, timeframe) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getVMStats(nodeId, vmId, timeframe);
    });
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

new ProxmoxDesktopApp();