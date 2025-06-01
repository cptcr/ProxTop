import React, { useEffect, useState } from 'react';
import { Archive, Calendar, Clock, Download, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useProxmox } from '../hooks/useProxmox';

interface BackupJob {
  id: string;
  node: string;
  vmid: number;
  type: string;
  schedule: string;
  enabled: boolean;
  storage: string;
  compress: string;
  mode: string;
}

interface BackupFile {
  volid: string;
  vmid: number;
  size: number;
  ctime: number;
  format: string;
  content: string;
}

const BackupManager: React.FC = () => {
  const { nodes } = useProxmox();
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'jobs' | 'files'>('jobs');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    setLoading(true);
    try {
      // Mock backup data - in real implementation, these would come from Proxmox API
      const mockJobs: BackupJob[] = [
        {
          id: '1',
          node: 'pve-node1',
          vmid: 100,
          type: 'qemu',
          schedule: '0 2 * * *',
          enabled: true,
          storage: 'backup-storage',
          compress: 'lzo',
          mode: 'snapshot',
        },
        {
          id: '2',
          node: 'pve-node1',
          vmid: 101,
          type: 'lxc',
          schedule: '0 3 * * 0',
          enabled: true,
          storage: 'backup-storage',
          compress: 'gzip',
          mode: 'stop',
        },
      ];

      const mockFiles: BackupFile[] = [
        {
          volid: 'backup-storage:backup/vzdump-qemu-100-2024_06_01-02_00_15.vma.lzo',
          vmid: 100,
          size: 5368709120,
          ctime: Date.now() - 86400000,
          format: 'vma.lzo',
          content: 'backup',
        },
        {
          volid: 'backup-storage:backup/vzdump-lxc-101-2024_05_31-03_00_20.tar.gz',
          vmid: 101,
          size: 1073741824,
          ctime: Date.now() - 172800000,
          format: 'tar.gz',
          content: 'backup',
        },
      ];

      setBackupJobs(mockJobs);
      setBackupFiles(mockFiles);
    } catch (error) {
      console.error('Failed to fetch backup data:', error);
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

  const formatSchedule = (schedule: string) => {
    // Simple cron to human readable conversion
    const parts = schedule.split(' ');
    if (parts.length >= 5) {
      const minute = parts[0];
      const hour = parts[1];
      const day = parts[2];
      const month = parts[3];
      const weekday = parts[4];

      if (day === '*' && month === '*' && weekday === '*') {
        return `Daily at ${hour}:${minute.padStart(2, '0')}`;
      } else if (day === '*' && month === '*' && weekday !== '*') {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[parseInt(weekday)]} at ${hour}:${minute.padStart(2, '0')}`;
      }
    }
    return schedule;
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Backup Management</h1>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('jobs')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'jobs'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Backup Jobs
            </button>
            <button
              onClick={() => setSelectedTab('files')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'files'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Backup Files
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Backup</span>
          </button>
          <button
            onClick={fetchBackupData}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      ) : selectedTab === 'jobs' ? (
        /* Backup Jobs Tab */
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Scheduled Backup Jobs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VM/CT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Node
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Settings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backupJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Archive className="h-5 w-5 text-blue-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {job.type.toUpperCase()} {job.vmid}
                            </div>
                            <div className="text-sm text-gray-500">{job.type === 'qemu' ? 'Virtual Machine' : 'Container'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.node}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{formatSchedule(job.schedule)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.storage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          <div>Mode: {job.mode}</div>
                          <div>Compression: {job.compress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={job.enabled ? 'status-running' : 'status-stopped'}>
                          {job.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">Edit</button>
                          <button className="text-green-600 hover:text-green-900">Run Now</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Backup Files Tab */
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Files</h3>
            <div className="space-y-4">
              {backupFiles.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <Archive className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          VM/CT {file.vmid} Backup
                        </h4>
                        <p className="text-sm text-gray-500">{file.volid.split(':')[1]}</p>
                        <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {format(new Date(file.ctime), 'PPP p')}
                          </div>
                          <div>{formatBytes(file.size)}</div>
                          <div>{file.format}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="btn-secondary flex items-center space-x-1">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                      <button className="btn-secondary">Restore</button>
                      <button className="btn-danger p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(backupJobs.length === 0 && selectedTab === 'jobs') && !loading && (
        <div className="text-center py-12">
          <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Backup Jobs</h3>
          <p className="text-gray-500">Create your first backup job to get started</p>
        </div>
      )}

      {(backupFiles.length === 0 && selectedTab === 'files') && !loading && (
        <div className="text-center py-12">
          <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Backup Files</h3>
          <p className="text-gray-500">No backup files found in storage</p>
        </div>
      )}

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Backup Job</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Node</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    {nodes.map((node) => (
                      <option key={node.node} value={node.node}>{node.node}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">VM/Container ID</label>
                  <input
                    type="number"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Storage</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="backup-storage">backup-storage</option>
                    <option value="local">local</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mode</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="snapshot">Snapshot</option>
                    <option value="suspend">Suspend</option>
                    <option value="stop">Stop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compression</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="lzo">LZO</option>
                    <option value="gzip">GZIP</option>
                    <option value="zstd">ZSTD</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle backup creation
                    setShowCreateModal(false);
                  }}
                  className="btn-primary"
                >
                  Create Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManager;