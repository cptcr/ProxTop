// src/main/main.ts - Fixed with GPU error handling
import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { ProxmoxAPI } from './api/proxmox';

// Fix GPU process crashes
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-gpu-process-crash-limit');

// Alternative: Disable hardware acceleration entirely (if the above doesn't work)
// app.disableHardwareAcceleration();

class ProxmoxDesktopApp {
  private mainWindow: BrowserWindow | null = null;
  private proxmoxAPI: ProxmoxAPI | null = null;

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
        app.quit();
      }
    });

    // Handle GPU process crashes
    app.on('gpu-process-crashed', (event, killed) => {
      console.log('GPU process crashed, killed:', killed);
      // Optionally restart the window or show a message
    });

    // Handle renderer process crashes
    app.on('render-process-gone', (event, webContents, details) => {
      console.log('Renderer process gone:', details.reason);
      // Optionally restart the window
      if (this.mainWindow && this.mainWindow.webContents === webContents) {
        this.createWindow();
      }
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
        // Additional GPU-related settings
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
      },
      // Window styling
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false,
      icon: process.platform === 'win32' ? path.join(__dirname, '../../assets/icon.ico') : undefined,
    });

    // Load the app
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      // Open DevTools in development
      this.mainWindow.webContents.openDevTools();
    } else {
      // In production, load the built files
      this.mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      
      // Focus the window
      if (isDev) {
        this.mainWindow?.focus();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle web contents crashes
    this.mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('Renderer process crashed:', details);
      
      // Show error dialog and optionally restart
      const { dialog } = require('electron');
      dialog.showErrorBox(
        'Application Error',
        `The application has crashed (${details.reason}). Please restart the application.`
      );
    });

    // Handle unresponsive window
    this.mainWindow.on('unresponsive', () => {
      console.warn('Window became unresponsive');
      
      const { dialog } = require('electron');
      const result = dialog.showMessageBoxSync(this.mainWindow!, {
        type: 'warning',
        buttons: ['Wait', 'Restart'],
        defaultId: 0,
        message: 'The application is not responding. Would you like to restart it?'
      });
      
      if (result === 1) {
        this.mainWindow?.reload();
      }
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
          { 
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
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
                detail: 'A modern desktop application for managing Proxmox VE clusters.'
              });
            }
          },
          {
            label: 'Restart Application',
            click: () => {
              app.relaunch();
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Optionally show error dialog
  const { dialog } = require('electron');
  dialog.showErrorBox('Unexpected Error', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

new ProxmoxDesktopApp();