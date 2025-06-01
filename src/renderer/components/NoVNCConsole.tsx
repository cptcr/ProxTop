// File: src/renderer/components/NoVNCConsole.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Maximize2, Minimize2, Settings, Power, RotateCcw, Square } from 'lucide-react';

interface NoVNCConsoleProps {
  vmId: number;
  nodeId: string;
  vmName: string;
  onClose: () => void;
}

interface ConsoleSettings {
  scaling: boolean;
  clipboard: boolean;
  viewOnly: boolean;
  showDotCursor: boolean;
  quality: number;
  compression: number;
}

const NoVNCConsole: React.FC<NoVNCConsoleProps> = ({ vmId, nodeId, vmName, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consoleUrl, setConsoleUrl] = useState<string>('');
  
  const [settings, setSettings] = useState<ConsoleSettings>({
    scaling: true,
    clipboard: true,
    viewOnly: false,
    showDotCursor: false,
    quality: 6,
    compression: 2,
  });

  useEffect(() => {
    initializeConsole();
    return () => {
      // Cleanup WebSocket connection
      disconnect();
    };
  }, [vmId, nodeId]);

  const initializeConsole = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      // In real implementation, this would get the VNC ticket from Proxmox API
      const mockConsoleUrl = `wss://localhost:8006/api2/json/nodes/${nodeId}/qemu/${vmId}/vncwebsocket?port=5900&vncticket=mock-ticket`;
      setConsoleUrl(mockConsoleUrl);
      
      // Simulate VNC connection
      await simulateVNCConnection();
      
    } catch (err) {
      setError(`Failed to connect to VM console: ${(err as Error).message}`);
    } finally {
      setConnecting(false);
    }
  };

  const simulateVNCConnection = async () => {
    // In a real implementation, this would use the noVNC library
    // For demo purposes, we'll simulate a connection
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          setConnected(true);
          drawMockConsole();
          resolve();
        } else {
          reject(new Error('Connection failed'));
        }
      }, 2000);
    });
  };

  const drawMockConsole = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Draw a mock desktop
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(1, '#3b82f6');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw mock terminal window
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(50, 50, 700, 400);
    
    // Terminal header
    ctx.fillStyle = '#374151';
    ctx.fillRect(50, 50, 700, 30);
    
    // Terminal text
    ctx.fillStyle = '#10b981';
    ctx.font = '14px monospace';
    ctx.fillText('root@vm-' + vmId + ':~# ', 70, 100);
    ctx.fillText('Welcome to Ubuntu 22.04 LTS', 70, 130);
    ctx.fillText('Last login: ' + new Date().toLocaleString(), 70, 160);
    ctx.fillText('root@vm-' + vmId + ':~# ls -la', 70, 190);
    ctx.fillText('total 24', 70, 220);
    ctx.fillText('drwx------ 4 root root 4096 Jan  1 12:00 .', 70, 250);
    ctx.fillText('drwxr-xr-x 3 root root 4096 Jan  1 12:00 ..', 70, 280);
    ctx.fillText('-rw-r--r-- 1 root root  570 Jan  1 12:00 .bashrc', 70, 310);
    ctx.fillText('-rw-r--r-- 1 root root  148 Jan  1 12:00 .profile', 70, 340);
    ctx.fillText('root@vm-' + vmId + ':~# _', 70, 380);
    
    // Add a blinking cursor animation
    let cursorVisible = true;
    setInterval(() => {
      if (!ctx || !connected) return;
      
      if (cursorVisible) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(220, 365, 10, 15);
      } else {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(220, 365, 10, 15);
      }
      cursorVisible = !cursorVisible;
    }, 500);
  };

  const disconnect = () => {
    setConnected(false);
    setConnecting(false);
    setError(null);
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  const sendCtrlAltDel = () => {
    if (connected) {
      // In real implementation, this would send the key combination to the VM
      console.log('Sending Ctrl+Alt+Del to VM', vmId);
      alert('Ctrl+Alt+Del sent to VM');
    }
  };

  const handleVMAction = async (action: string) => {
    try {
      switch (action) {
        case 'shutdown':
          // Send ACPI shutdown
          await window.electronAPI.stopVM(nodeId, vmId.toString());
          break;
        case 'reboot':
          await window.electronAPI.rebootVM(nodeId, vmId.toString());
          break;
        case 'reset':
          // Hard reset
          await window.electronAPI.stopVM(nodeId, vmId.toString());
          setTimeout(() => {
            window.electronAPI.startVM(nodeId, vmId.toString());
          }, 2000);
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} VM:`, error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-gray-800">
        <div className="flex items-center space-x-4">
          <Monitor className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-semibold">{vmName}</h2>
            <p className="text-sm text-gray-300">VM {vmId} on {nodeId}</p>
          </div>
          {connected && (
            <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">
              Connected
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* VM Control Buttons */}
          <button
            onClick={sendCtrlAltDel}
            disabled={!connected}
            className="px-3 py-2 text-sm text-white bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
            title="Send Ctrl+Alt+Del"
          >
            Ctrl+Alt+Del
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-white bg-gray-700 rounded hover:bg-gray-600"
              title="Console Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {showSettings && (
              <div className="absolute right-0 z-10 w-64 mt-2 bg-white rounded-md shadow-lg">
                <div className="p-4 space-y-4">
                  <h3 className="font-medium text-gray-900">Console Settings</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Scaling</label>
                      <input
                        type="checkbox"
                        checked={settings.scaling}
                        onChange={(e) => setSettings({...settings, scaling: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Clipboard</label>
                      <input
                        type="checkbox"
                        checked={settings.clipboard}
                        onChange={(e) => setSettings({...settings, clipboard: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">View Only</label>
                      <input
                        type="checkbox"
                        checked={settings.viewOnly}
                        onChange={(e) => setSettings({...settings, viewOnly: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm text-gray-700">Quality ({settings.quality})</label>
                      <input
                        type="range"
                        min="0"
                        max="9"
                        value={settings.quality}
                        onChange={(e) => setSettings({...settings, quality: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm text-gray-700">Compression ({settings.compression})</label>
                      <input
                        type="range"
                        min="0"
                        max="9"
                        value={settings.compression}
                        onChange={(e) => setSettings({...settings, compression: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-white bg-gray-700 rounded hover:bg-gray-600"
            title="Toggle Fullscreen"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          {/* VM Actions */}
          <div className="pl-2 ml-2 border-l border-gray-600">
            <button
              onClick={() => handleVMAction('shutdown')}
              className="p-2 mx-1 text-white bg-orange-600 rounded hover:bg-orange-700"
              title="Shutdown VM"
            >
              <Power className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleVMAction('reboot')}
              className="p-2 mx-1 text-white bg-blue-600 rounded hover:bg-blue-700"
              title="Reboot VM"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleVMAction('reset')}
              className="p-2 mx-1 text-white bg-red-600 rounded hover:bg-red-700"
              title="Hard Reset VM"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Console Content */}
      <div className="relative flex-1 bg-black">
        {connecting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-white rounded-full animate-spin"></div>
              <p className="text-lg">Connecting to VM console...</p>
              <p className="mt-2 text-sm text-gray-300">Establishing VNC connection</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-8 text-center text-white bg-red-900 bg-opacity-75 rounded-lg">
              <h3 className="mb-4 text-xl font-semibold">Connection Error</h3>
              <p className="mb-4 text-gray-200">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={initializeConsole}
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Retry Connection
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {connected && (
          <div className="flex items-center justify-center h-full">
            <canvas
              ref={canvasRef}
              className={`border border-gray-600 ${settings.scaling ? 'max-w-full max-h-full' : ''}`}
              style={{
                cursor: settings.viewOnly ? 'default' : 'crosshair',
                imageRendering: 'pixelated'
              }}
            />
          </div>
        )}
        
        {/* Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-2 text-sm text-white bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>Status: {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}</span>
              {consoleUrl && (
                <span className="text-gray-300">URL: {consoleUrl.replace(/vncticket=.*/, 'vncticket=***')}</span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-xs">
              {settings.scaling && <span className="px-2 py-1 bg-green-600 rounded">Scaling</span>}
              {settings.viewOnly && <span className="px-2 py-1 bg-yellow-600 rounded">View Only</span>}
              {settings.clipboard && <span className="px-2 py-1 bg-blue-600 rounded">Clipboard</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoVNCConsole;