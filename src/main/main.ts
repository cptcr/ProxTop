// src/main/main.ts - Enhanced GPU error handling and fallbacks
import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { ProxmoxAPI } from './api/proxmox';

// Enhanced GPU crash prevention
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-gpu-process-crash-limit');
app.commandLine.appendSwitch('--disable-gpu-blacklist');
app.commandLine.appendSwitch('--disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('--disable-accelerated-jpeg-decoding');
app.commandLine.appendSwitch('--disable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('--disable-accelerated-video-decode');
app.commandLine.appendSwitch('--disable-accelerated-video-encode');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');

// Disable hardware acceleration entirely for stability
app.disableHardwareAcceleration();

class ProxmoxDesktopApp {
  private mainWindow: BrowserWindow | null = null;
  private proxmoxAPI: ProxmoxAPI | null = null;
  private isQuitting = false;

  constructor() {
    // Handle app ready event
    app.whenReady().then(() => {
      this.createWindow();
      
      // Handle app activation (macOS)
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    // Handle window close events
    app.on('window-all-closed', () => {
      // On macOS, keep app running even when all windows are closed
      if (process.platform !== 'darwin') {
        this.isQuitting = true;
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    // Enhanced GPU process crash handling
    app.on('gpu-process-crashed', (event, killed) => {
      console.log('GPU process crashed, killed:', killed);
      console.log('Attempting to recover...');
      
      if (!this.isQuitting) {
        // Try to recreate the window with software rendering
        if (this.mainWindow) {
          this.mainWindow.destroy();
        }
        
        setTimeout(() => {
          this.createWindow();
        }, 1000);
      }
    });

    // Handle renderer process crashes
    app.on('render-process-gone', (event, webContents, details) => {
      console.log('Renderer process gone:', details.reason);
      
      if (!this.isQuitting && this.mainWindow && this.mainWindow.webContents === webContents) {
        console.log('Attempting to recover renderer process...');
        this.createWindow();
      }
    });

    // Handle child process crashes
    app.on('child-process-gone', (event, details) => {
      console.log('Child process gone:', details.type, details.reason);
    });

    this.setupIPC();
  }

  private createWindow(): void {
    // Destroy existing window if it exists
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
        // Enhanced stability settings
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        // Disable GPU features in renderer
        enableBlinkFeatures: '',
        disableBlinkFeatures: 'Accelerated2dCanvas,AcceleratedSmallCanvases',
        // Memory and performance settings
        backgroundThrottling: false,
        offscreen: false,
      },
      // Window styling
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false,
      icon: process.platform === 'win32' ? path.join(__dirname, '../../assets/icon.ico') : undefined,
      // Additional stability options
      autoHideMenuBar: false,
      resizable: true,
      maximizable: true,
      minimizable: true,
      closable: true,
    });

    // Load the app
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000').catch(err => {
        console.error('Failed to load dev URL:', err);
        // Fallback to built files
        this.loadBuiltFiles();
      });
      
      // Open DevTools in development
      this.mainWindow.webContents.openDevTools();
    } else {
      this.loadBuiltFiles();
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (!this.isQuitting && this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.show();
        
        // Focus the window
        if (isDev) {
          this.mainWindow.focus();
        }
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Enhanced crash handling for web contents
    this.mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('Renderer process crashed:', details);
      
      if (!this.isQuitting) {
        const { dialog } = require('electron');
        const result = dialog.showMessageBoxSync(this.mainWindow!, {
          type: 'error',
          buttons: ['Restart', 'Close'],
          defaultId: 0,
          title: 'Application Crashed',
          message: 'The application has crashed. Would you like to restart it?',
          detail: `Reason: ${details.reason}\nExit Code: ${details.exitCode}`
        });
        
        if (result === 0) {
          this.createWindow();
        } else {
          app.quit();
        }
      }
    });

    // Handle unresponsive window
    this.mainWindow.on('unresponsive', () => {
      console.warn('Window became unresponsive');
      
      if (!this.isQuitting) {
        const { dialog } = require('electron');
        const result = dialog.showMessageBoxSync(this.mainWindow!, {
          type: 'warning',
          buttons: ['Wait', 'Restart'],
          defaultId: 0,
          title: 'Application Not Responding',
          message: 'The application is not responding. Would you like to restart it?'
        });
        
        if (result === 1) {
          this.createWindow();
        }
      }
    });

    // Handle navigation errors
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load:', errorCode, errorDescription, validatedURL);
      
      if (!this.isQuitting && errorCode !== -3) { // -3 is user abort
        setTimeout(() => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.reload();
          }
        }, 2000);
      }
    });

    this.createMenu();
  }

  private loadBuiltFiles(): void {
    const builtPath = path.join(__dirname, '../out/index.html');
    console.log('Attempting to load built files from:', builtPath);
    this.mainWindow?.loadFile(builtPath).catch(err => {
      console.error('Failed to load built files:', err);
      
      // Show error page
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
                .error-message { margin-bottom: 30px; line-height: 1.6; }
                .retry-button {
                    background: #1976d2;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }
                .retry-button:hover { background: #1565c0; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1 class="error-title">ProxTop Failed to Load</h1>
                <p class="error-message">
                    The application failed to load properly. This might be due to missing files or a build issue.
                </p>
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
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
          ...(process.platform === 'darwin' ? [
            { type: 'separator' },
            { role: 'front' }
          ] : [])
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About ProxTop',
            click: () => {
              const { dialog } = require('electron');
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'About ProxTop',
                message: 'ProxTop v1.0.0',
                detail: 'A modern desktop application for managing Proxmox VE clusters.\n\nBuilt with Electron, React, and TypeScript.'
              });
            }
          },
          {
            label: 'Restart Application',
            click: () => {
              this.isQuitting = true;
              app.relaunch();
              app.exit();
            }
          },
          {
            label: 'Safe Mode (Software Rendering)',
            click: () => {
              this.isQuitting = true;
              app.relaunch({
                args: process.argv.slice(1).concat(['--disable-hardware-acceleration', '--disable-gpu'])
              });
              app.exit();
            }
          }
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }

  private setupIPC(): void {
    // ========== CONNECTION MANAGEMENT ==========
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

    // ========== CLUSTER MANAGEMENT ==========
    ipcMain.handle('proxmox:getClusterStatus', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getClusterStatus();
    });

    ipcMain.handle('proxmox:getClusterResources', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getClusterResources();
    });

    ipcMain.handle('proxmox:getClusterConfig', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getClusterConfig();
    });

    ipcMain.handle('proxmox:getClusterOptions', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getClusterOptions();
    });

    ipcMain.handle('proxmox:updateClusterOptions', async (_, options) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateClusterOptions(options);
    });

    // ========== NODE MANAGEMENT ==========
    ipcMain.handle('proxmox:getNodes', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodes();
    });

    ipcMain.handle('proxmox:getNodeStatus', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodeStatus(nodeId);
    });

    ipcMain.handle('proxmox:getNodeVersion', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodeVersion(nodeId);
    });

    ipcMain.handle('proxmox:getNodeTime', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodeTime(nodeId);
    });

    ipcMain.handle('proxmox:getNodeDNS', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodeDNS(nodeId);
    });

    ipcMain.handle('proxmox:updateNodeDNS', async (_, nodeId, dns) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateNodeDNS(nodeId, dns);
    });

    ipcMain.handle('proxmox:getNodeHosts', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodeHosts(nodeId);
    });

    ipcMain.handle('proxmox:updateNodeHosts', async (_, nodeId, hosts) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateNodeHosts(nodeId, hosts);
    });

    // ========== VM MANAGEMENT ==========
    ipcMain.handle('proxmox:getVMs', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getVMs(nodeId);
    });

    ipcMain.handle('proxmox:getFilteredVMs', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getFilteredVMs(nodeId);
    });

    ipcMain.handle('proxmox:getVMStatus', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getVMStatus(nodeId, vmId);
    });

    ipcMain.handle('proxmox:getVMConfig', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getVMConfig(nodeId, vmId);
    });

    ipcMain.handle('proxmox:updateVMConfig', async (_, nodeId, vmId, config) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateVMConfig(nodeId, vmId, config);
    });

    ipcMain.handle('proxmox:createVM', async (_, nodeId, config) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createVM(nodeId, config);
    });

    ipcMain.handle('proxmox:deleteVM', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deleteVM(nodeId, vmId);
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

    ipcMain.handle('proxmox:resetVM', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.resetVM(nodeId, vmId);
    });

    ipcMain.handle('proxmox:shutdownVM', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.shutdownVM(nodeId, vmId);
    });

    ipcMain.handle('proxmox:migrateVM', async (_, nodeId, vmId, target, options) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.migrateVM(nodeId, vmId, target, options);
    });

    ipcMain.handle('proxmox:cloneVM', async (_, nodeId, vmId, newid, options) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.cloneVM(nodeId, vmId, newid, options);
    });

    ipcMain.handle('proxmox:getVMSnapshots', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getVMSnapshots(nodeId, vmId);
    });

    ipcMain.handle('proxmox:createVMSnapshot', async (_, nodeId, vmId, snapname, description) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createVMSnapshot(nodeId, vmId, snapname, description);
    });

    ipcMain.handle('proxmox:deleteVMSnapshot', async (_, nodeId, vmId, snapname) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deleteVMSnapshot(nodeId, vmId, snapname);
    });

    ipcMain.handle('proxmox:rollbackVMSnapshot', async (_, nodeId, vmId, snapname) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.rollbackVMSnapshot(nodeId, vmId, snapname);
    });

    // ========== CONTAINER MANAGEMENT ==========
    ipcMain.handle('proxmox:getContainers', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getContainers(nodeId);
    });

    ipcMain.handle('proxmox:getFilteredContainers', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getFilteredContainers(nodeId);
    });

    ipcMain.handle('proxmox:getContainerStatus', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getContainerStatus(nodeId, ctId);
    });

    ipcMain.handle('proxmox:getContainerConfig', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getContainerConfig(nodeId, ctId);
    });

    ipcMain.handle('proxmox:updateContainerConfig', async (_, nodeId, ctId, config) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateContainerConfig(nodeId, ctId, config);
    });

    ipcMain.handle('proxmox:createContainer', async (_, nodeId, config) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createContainer(nodeId, config);
    });

    ipcMain.handle('proxmox:deleteContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deleteContainer(nodeId, ctId);
    });

    ipcMain.handle('proxmox:startContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.startContainer(nodeId, ctId);
    });

    ipcMain.handle('proxmox:stopContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.stopContainer(nodeId, ctId);
    });

    ipcMain.handle('proxmox:rebootContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.rebootContainer(nodeId, ctId);
    });

    ipcMain.handle('proxmox:suspendContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.suspendContainer(nodeId, ctId);
    });

    ipcMain.handle('proxmox:resumeContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.resumeContainer(nodeId, ctId);
    });

    ipcMain.handle('proxmox:shutdownContainer', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.shutdownContainer(nodeId, ctId);
    });

    ipcMain.handle('proxmox:migrateContainer', async (_, nodeId, ctId, target, options) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.migrateContainer(nodeId, ctId, target, options);
    });

    ipcMain.handle('proxmox:cloneContainer', async (_, nodeId, ctId, newid, options) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.cloneContainer(nodeId, ctId, newid, options);
    });

    ipcMain.handle('proxmox:getContainerSnapshots', async (_, nodeId, ctId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getContainerSnapshots(nodeId, ctId);
    });

    ipcMain.handle('proxmox:createContainerSnapshot', async (_, nodeId, ctId, snapname, description) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createContainerSnapshot(nodeId, ctId, snapname, description);
    });

    // ========== STORAGE MANAGEMENT ==========
    ipcMain.handle('proxmox:getStorage', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getStorage(nodeId);
    });

    ipcMain.handle('proxmox:getStorageContent', async (_, nodeId, storage, content) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getStorageContent(nodeId, storage, content);
    });

    ipcMain.handle('proxmox:uploadToStorage', async (_, nodeId, storage, file) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.uploadToStorage(nodeId, storage, file);
    });

    ipcMain.handle('proxmox:deleteStorageContent', async (_, nodeId, storage, volume) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deleteStorageContent(nodeId, storage, volume);
    });

    // ========== BACKUP MANAGEMENT ==========
    ipcMain.handle('proxmox:getBackups', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getBackups();
    });

    ipcMain.handle('proxmox:createBackup', async (_, nodeId, vmid, options) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createBackup(nodeId, vmid, options);
    });

    ipcMain.handle('proxmox:getBackupJobs', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getBackupJobs();
    });

    ipcMain.handle('proxmox:createBackupJob', async (_, job) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createBackupJob(job);
    });

    ipcMain.handle('proxmox:updateBackupJob', async (_, id, job) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateBackupJob(id, job);
    });

    ipcMain.handle('proxmox:deleteBackupJob', async (_, id) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deleteBackupJob(id);
    });

    // ========== NETWORK MANAGEMENT ==========
    ipcMain.handle('proxmox:getNetworkConfig', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNetworkConfig(nodeId);
    });

    ipcMain.handle('proxmox:updateNetworkConfig', async (_, nodeId, iface, config) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateNetworkConfig(nodeId, iface, config);
    });

    ipcMain.handle('proxmox:createNetworkInterface', async (_, nodeId, config) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createNetworkInterface(nodeId, config);
    });

    ipcMain.handle('proxmox:deleteNetworkInterface', async (_, nodeId, iface) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deleteNetworkInterface(nodeId, iface);
    });

    ipcMain.handle('proxmox:applyNetworkConfig', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.applyNetworkConfig(nodeId);
    });

    ipcMain.handle('proxmox:revertNetworkConfig', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.revertNetworkConfig(nodeId);
    });

    // ========== FIREWALL MANAGEMENT ==========
    ipcMain.handle('proxmox:getFirewallGroups', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getFirewallGroups();
    });

    ipcMain.handle('proxmox:getFirewallRules', async (_, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getFirewallRules(nodeId, vmId);
    });

    ipcMain.handle('proxmox:createFirewallRule', async (_, rule, nodeId, vmId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createFirewallRule(rule, nodeId, vmId);
    });

    // ========== USER & ACCESS MANAGEMENT ==========
    ipcMain.handle('proxmox:getUsers', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getUsers();
    });

    ipcMain.handle('proxmox:createUser', async (_, user) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createUser(user);
    });

    ipcMain.handle('proxmox:updateUser', async (_, userid, user) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateUser(userid, user);
    });

    ipcMain.handle('proxmox:deleteUser', async (_, userid) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deleteUser(userid);
    });

    ipcMain.handle('proxmox:getGroups', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getGroups();
    });

    ipcMain.handle('proxmox:createGroup', async (_, group) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createGroup(group);
    });

    ipcMain.handle('proxmox:updateGroup', async (_, groupid, group) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateGroup(groupid, group);
    });

    ipcMain.handle('proxmox:deleteGroup', async (_, groupid) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deleteGroup(groupid);
    });

    ipcMain.handle('proxmox:getRoles', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getRoles();
    });

    ipcMain.handle('proxmox:getACL', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getACL();
    });

    ipcMain.handle('proxmox:updateACL', async (_, acl) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateACL(acl);
    });

    // ========== MONITORING & STATISTICS ==========
    ipcMain.handle('proxmox:getNodeStats', async (_, nodeId, timeframe) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getNodeStats(nodeId, timeframe);
    });

    ipcMain.handle('proxmox:getVMStats', async (_, nodeId, vmId, timeframe) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getVMStats(nodeId, vmId, timeframe);
    });

    ipcMain.handle('proxmox:getContainerStats', async (_, nodeId, ctId, timeframe) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getContainerStats(nodeId, ctId, timeframe);
    });

    ipcMain.handle('proxmox:getStorageStats', async (_, nodeId, storage, timeframe) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getStorageStats(nodeId, storage, timeframe);
    });

    // ========== TASKS MANAGEMENT ==========
    ipcMain.handle('proxmox:getTasks', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getTasks(nodeId);
    });

    ipcMain.handle('proxmox:getTaskStatus', async (_, nodeId, upid) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getTaskStatus(nodeId, upid);
    });

    ipcMain.handle('proxmox:getTaskLog', async (_, nodeId, upid) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getTaskLog(nodeId, upid);
    });

    ipcMain.handle('proxmox:stopTask', async (_, nodeId, upid) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.stopTask(nodeId, upid);
    });

    // ========== POOL MANAGEMENT ==========
    ipcMain.handle('proxmox:getPools', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getPools();
    });

    ipcMain.handle('proxmox:createPool', async (_, pool) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createPool(pool);
    });

    ipcMain.handle('proxmox:updatePool', async (_, poolid, pool) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updatePool(poolid, pool);
    });

    ipcMain.handle('proxmox:deletePool', async (_, poolid) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deletePool(poolid);
    });

    // ========== TEMPLATE MANAGEMENT ==========
    ipcMain.handle('proxmox:getTemplates', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getTemplates(nodeId);
    });

    ipcMain.handle('proxmox:downloadTemplate', async (_, nodeId, template) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.downloadTemplate(nodeId, template);
    });

    // ========== CERTIFICATE MANAGEMENT ==========
    ipcMain.handle('proxmox:getCertificates', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getCertificates(nodeId);
    });

    ipcMain.handle('proxmox:uploadCertificate', async (_, nodeId, cert) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.uploadCertificate(nodeId, cert);
    });

    // ========== REPLICATION MANAGEMENT ==========
    ipcMain.handle('proxmox:getReplicationJobs', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getReplicationJobs();
    });

    ipcMain.handle('proxmox:createReplicationJob', async (_, job) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createReplicationJob(job);
    });

    ipcMain.handle('proxmox:updateReplicationJob', async (_, id, job) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.updateReplicationJob(id, job);
    });

    ipcMain.handle('proxmox:deleteReplicationJob', async (_, id) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.deleteReplicationJob(id);
    });

    // ========== CEPH MANAGEMENT ==========
    ipcMain.handle('proxmox:getCephStatus', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getCephStatus(nodeId);
    });

    ipcMain.handle('proxmox:getCephOSDs', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getCephOSDs(nodeId);
    });

    ipcMain.handle('proxmox:getCephMONs', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getCephMONs(nodeId);
    });

    ipcMain.handle('proxmox:getCephPools', async (_, nodeId) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getCephPools(nodeId);
    });

    // ========== HA MANAGEMENT ==========
    ipcMain.handle('proxmox:getHAResources', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getHAResources();
    });

    ipcMain.handle('proxmox:getHAGroups', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getHAGroups();
    });

    ipcMain.handle('proxmox:getHAStatus', async () => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.getHAStatus();
    });

    ipcMain.handle('proxmox:createHAResource', async (_, resource) => {
      if (!this.proxmoxAPI) throw new Error('Not connected');
      return this.proxmoxAPI.createHAResource(resource);
    });
  }
}

// Enhanced uncaught exception handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  const { dialog } = require('electron');
  try {
    dialog.showErrorBox(
      'Unexpected Error', 
      `An unexpected error occurred: ${error.message}\n\nThe application may be unstable. Please restart if you experience issues.`
    );
  } catch (dialogError) {
    console.error('Failed to show error dialog:', dialogError);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  app.quit();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  app.quit();
});

new ProxmoxDesktopApp();
