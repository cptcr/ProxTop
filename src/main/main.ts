// EMERGENCY FIX - main.ts with alternative port handling
import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { ProxmoxAPI } from './api/proxmox';

// Enhanced GPU crash prevention
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--use-gl=disabled');
app.commandLine.appendSwitch('--disable-d3d11');
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
        webSecurity: false,
      },
      show: false,
    });

    // TRY MULTIPLE PORTS
    this.tryLoadNextJS();

    this.mainWindow.once('ready-to-show', () => {
      if (!this.isQuitting && this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.show();
        console.log('ProxTop window shown successfully!');
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.createMenu();
  }

  private async tryLoadNextJS(): Promise<void> {
    const ports = [3000, 3001, 3002, 3003];
    
    for (const port of ports) {
      try {
        console.log(`Trying to load from port ${port}...`);
        await this.mainWindow?.loadURL(`http://localhost:${port}`);
        console.log(`Successfully loaded from port ${port}!`);
        return;
      } catch (error) {
        console.log(`Port ${port} failed, trying next...`);
        continue;
      }
    }
    
    // If all ports fail, show error page
    this.showErrorPage('No Next.js server found on ports 3000-3003. Make sure Next.js is running!');
  }

  private showErrorPage(message: string): void {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>ProxTop - Error</title>
          <meta charset="UTF-8">
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }
              .container {
                  background: rgba(255,255,255,0.1);
                  backdrop-filter: blur(10px);
                  border-radius: 20px;
                  padding: 40px;
                  text-align: center;
                  max-width: 500px;
                  border: 1px solid rgba(255,255,255,0.2);
              }
              h1 { font-size: 2.5em; margin-bottom: 20px; color: #ff6b6b; }
              p { font-size: 1.1em; margin-bottom: 30px; line-height: 1.6; }
              .buttons { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }
              button {
                  background: #4ecdc4;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 25px;
                  cursor: pointer;
                  font-size: 1em;
                  font-weight: 600;
                  transition: all 0.3s ease;
              }
              button:hover { background: #45b7aa; transform: translateY(-2px); }
              .debug { 
                  background: rgba(0,0,0,0.3); 
                  border-radius: 10px; 
                  padding: 20px; 
                  margin-top: 20px; 
                  text-align: left; 
                  font-family: monospace; 
              }
              .status { color: #4ecdc4; margin-bottom: 10px; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🚀 ProxTop Loading...</h1>
              <p>${message}</p>
              
              <div class="debug">
                  <div class="status">🔍 Debug Information:</div>
                  <div>• Expected: Next.js dev server</div>
                  <div>• Ports checked: 3000, 3001, 3002, 3003</div>
                  <div>• Time: ${new Date().toLocaleTimeString()}</div>
              </div>
              
              <div class="buttons">
                  <button onclick="location.reload()">🔄 Retry</button>
                  <button onclick="window.electronAPI?.quit?.() || window.close()">❌ Quit</button>
              </div>
              
              <p style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
                Start Next.js manually: <strong>npm run dev:renderer</strong>
              </p>
          </div>
          
          <script>
              // Auto-retry every 5 seconds
              let retryCount = 0;
              const maxRetries = 12; // 1 minute total
              
              function autoRetry() {
                  if (retryCount < maxRetries) {
                      retryCount++;
                      console.log(\`Auto-retry \${retryCount}/\${maxRetries}\`);
                      setTimeout(() => location.reload(), 5000);
                  }
              }
              
              autoRetry();
          </script>
      </body>
      </html>
    `;
    
    this.mainWindow?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
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