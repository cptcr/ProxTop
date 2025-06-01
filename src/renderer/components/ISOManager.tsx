import React, { useEffect, useState } from 'react';
import { Disc, Upload, Download, Trash2, RefreshCw, HardDrive, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useProxmox } from '../hooks/useProxmox';

interface ISOFile {
  volid: string;
  content: string;
  size: number;
  ctime: number;
  format: string;
  storage: string;
  vmid?: number;
  notes?: string;
}

interface StorageNode {
  storage: string;
  node: string;
  type: string;
  content: string;
  enabled: boolean;
  shared: boolean;
}

const ISOManager: React.FC = () => {
  const { nodes } = useProxmox();
  const [isoFiles, setIsoFiles] = useState<ISOFile[]>([]);
  const [storageNodes, setStorageNodes] = useState<StorageNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadStorage, setUploadStorage] = useState<string>('');

  useEffect(() => {
    fetchStorageNodes();
  }, [nodes]);

  useEffect(() => {
    if (selectedStorage) {
      fetchISOFiles();
    }
  }, [selectedStorage]);

  const fetchStorageNodes = async () => {
    setLoading(true);
    try {
      // Mock storage data - in real implementation, this would fetch from Proxmox API
      const mockStorages: StorageNode[] = [
        {
          storage: 'local',
          node: 'pve-node1',
          type: 'dir',
          content: 'iso,backup,vztmpl',
          enabled: true,
          shared: false,
        },
        {
          storage: 'iso-storage',
          node: 'pve-node1',
          type: 'nfs',
          content: 'iso',
          enabled: true,
          shared: true,
        },
        {
          storage: 'backup-storage',
          node: 'pve-node1',
          type: 'nfs',
          content: 'backup,iso',
          enabled: true,
          shared: true,
        },
      ];

      // Filter storages that support ISO content
      const isoStorages = mockStorages.filter(storage => 
        storage.content.includes('iso') && storage.enabled
      );
      
      setStorageNodes(isoStorages);
      
      if (isoStorages.length > 0 && !selectedStorage) {
        setSelectedStorage(isoStorages[0].storage);
      }
    } catch (error) {
      console.error('Failed to fetch storage nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchISOFiles = async () => {
    if (!selectedStorage) return;
    
    setLoading(true);
    try {
      // Mock ISO files - in real implementation, this would fetch from Proxmox API
      const mockISOs: ISOFile[] = [
        {
          volid: `${selectedStorage}:iso/ubuntu-22.04.3-live-server-amd64.iso`,
          content: 'iso',
          size: 1234567890,
          ctime: Date.now() - 86400000 * 7,
          format: 'iso',
          storage: selectedStorage,
          notes: 'Ubuntu 22.04 LTS Server',
        },
        {
          volid: `${selectedStorage}:iso/debian-12.2.0-amd64-netinst.iso`,
          content: 'iso',
          size: 654321098,
          ctime: Date.now() - 86400000 * 3,
          format: 'iso',
          storage: selectedStorage,
          notes: 'Debian 12 Bookworm',
        },
        {
          volid: `${selectedStorage}:iso/proxmox-ve_8.1-1.iso`,
          content: 'iso',
          size: 987654321,
          ctime: Date.now() - 86400000 * 14,
          format: 'iso',
          storage: selectedStorage,
          notes: 'Proxmox VE 8.1',
        },
        {
          volid: `${selectedStorage}:iso/windows-server-2022.iso`,
          content: 'iso',
          size: 5432109876,
          ctime: Date.now() - 86400000 * 21,
          format: 'iso',
          storage: selectedStorage,
          notes: 'Windows Server 2022',
        },
      ];

      setIsoFiles(mockISOs);
    } catch (error) {
      console.error('Failed to fetch ISO files:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileName = (volid: string) => {
    const parts = volid.split('/');
    return parts[parts.length - 1];
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || !uploadStorage) return;

    const files = Array.from(selectedFiles);
    
    for (const file of files) {
      const fileKey = file.name;
      setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

      try {
        // Simulate upload progress
        const uploadSimulation = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileKey] || 0;
            const newProgress = Math.min(currentProgress + Math.random() * 20, 100);
            
            if (newProgress >= 100) {
              clearInterval(uploadSimulation);
              
              // Add to ISO files list
              const newISO: ISOFile = {
                volid: `${uploadStorage}:iso/${file.name}`,
                content: 'iso',
                size: file.size,
                ctime: Date.now(),
                format: 'iso',
                storage: uploadStorage,
                notes: `Uploaded ${format(new Date(), 'PPP')}`,
              };
              
              setIsoFiles(prev => [newISO, ...prev]);
              
              // Clean up progress
              setTimeout(() => {
                setUploadProgress(prev => {
                  const newState = { ...prev };
                  delete newState[fileKey];
                  return newState;
                });
              }, 2000);
            }
            
            return { ...prev, [fileKey]: newProgress };
          });
        }, 500);
        
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[fileKey];
          return newState;
        });
      }
    }

    setShowUploadModal(false);
    setSelectedFiles(null);
  };

  const handleDelete = async (volid: string) => {
    if (confirm('Are you sure you want to delete this ISO file?')) {
      try {
        // In real implementation, this would call the Proxmox API
        setIsoFiles(prev => prev.filter(iso => iso.volid !== volid));
      } catch (error) {
        console.error('Failed to delete ISO file:', error);
      }
    }
  };

  const handleDownload = (volid: string) => {
    // In real implementation, this would initiate a download from Proxmox
    const filename = getFileName(volid);
    alert(`Download initiated for ${filename}`);
  };

  return (
    <div className="h-full p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">ISO Management</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value)}
            className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select Storage</option>
            {storageNodes.map((storage) => (
              <option key={storage.storage} value={storage.storage}>
                {storage.storage} ({storage.type})
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={!selectedStorage}
            className="flex items-center space-x-2 btn-primary"
          >
            <Upload className="w-4 h-4" />
            <span>Upload ISO</span>
          </button>
          <button
            onClick={fetchISOFiles}
            disabled={!selectedStorage}
            className="flex items-center space-x-2 btn-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Storage Information */}
      {selectedStorage && (
        <div className="mb-6 card">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <HardDrive className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedStorage}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {storageNodes.find(s => s.storage === selectedStorage)?.type} Storage
                  {storageNodes.find(s => s.storage === selectedStorage)?.shared && ' • Shared'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total ISOs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{isoFiles.length}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="card">
              <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Upload Progress</h3>
              <div className="space-y-3">
                {Object.entries(uploadProgress).map(([filename, progress]) => (
                  <div key={filename}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{filename}</span>
                      <span className="text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                      <div 
                        className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ISO Files Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isoFiles.map((iso) => (
              <div key={iso.volid} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Disc className="w-8 h-8 mr-3 text-orange-600" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate dark:text-white">
                        {getFileName(iso.volid)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{iso.storage}</p>
                    </div>
                  </div>
                </div>

                {iso.notes && (
                  <div className="mb-4">
                    <p className="p-2 text-sm text-gray-600 rounded dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                      {iso.notes}
                    </p>
                  </div>
                )}

                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Size:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatBytes(iso.size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{format(new Date(iso.ctime), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Format:</span>
                    <span className="font-medium text-gray-900 uppercase dark:text-white">{iso.format}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(iso.volid)}
                    className="flex items-center flex-1 space-x-1 btn-secondary"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleDelete(iso.volid)}
                    className="p-2 btn-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isoFiles.length === 0 && !loading && (
            <div className="py-12 text-center">
              <Disc className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">No ISO Files</h3>
              <p className="mb-4 text-gray-500 dark:text-gray-400">
                {selectedStorage ? `No ISO files found in ${selectedStorage}` : 'Select a storage to view ISO files'}
              </p>
              {selectedStorage && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary"
                >
                  Upload Your First ISO
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96 dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Upload ISO Files</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Storage</label>
                  <select
                    value={uploadStorage}
                    onChange={(e) => setUploadStorage(e.target.value)}
                    className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Storage</option>
                    {storageNodes.map((storage) => (
                      <option key={storage.storage} value={storage.storage}>
                        {storage.storage} ({storage.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ISO Files</label>
                  <input
                    type="file"
                    multiple
                    accept=".iso"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select one or more ISO files to upload. Only .iso files are accepted.
                  </p>
                </div>
                {selectedFiles && (
                  <div className="p-3 rounded bg-gray-50 dark:bg-gray-700">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selected Files ({selectedFiles.length}):
                    </p>
                    <div className="space-y-1">
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate dark:text-gray-400">{file.name}</span>
                          <span className="text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles(null);
                    setUploadStorage('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFiles || !uploadStorage}
                  className="btn-primary"
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ISOManager;