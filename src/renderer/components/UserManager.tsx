import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2, Shield, Key, Eye, EyeOff } from 'lucide-react';

interface ProxmoxUser {
  userid: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  groups?: string[];
  enable: boolean;
  expire?: number;
  comment?: string;
}

interface ProxmoxGroup {
  groupid: string;
  comment?: string;
  members?: string[];
}

interface ProxmoxRole {
  roleid: string;
  privs: string[];
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<ProxmoxUser[]>([]);
  const [groups, setGroups] = useState<ProxmoxGroup[]>([]);
  const [roles, setRoles] = useState<ProxmoxRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'users' | 'groups' | 'roles'>('users');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form data for creating/editing
  const [formData, setFormData] = useState({
    userid: '',
    password: '',
    firstname: '',
    lastname: '',
    email: '',
    groups: [] as string[],
    enable: true,
    comment: '',
    realm: 'pve',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, these would come from Proxmox API
      const mockUsers: ProxmoxUser[] = [
        {
          userid: 'root@pam',
          firstname: 'Administrator',
          lastname: 'Root',
          email: 'admin@example.com',
          groups: ['admin'],
          enable: true,
          comment: 'System administrator',
        },
        {
          userid: 'user1@pve',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          groups: ['users'],
          enable: true,
          comment: 'Regular user',
        },
        {
          userid: 'backup@pve',
          firstname: 'Backup',
          lastname: 'Service',
          email: 'backup@example.com',
          groups: ['backup'],
          enable: true,
          comment: 'Backup service account',
        },
      ];

      const mockGroups: ProxmoxGroup[] = [
        {
          groupid: 'admin',
          comment: 'Administrators with full access',
          members: ['root@pam'],
        },
        {
          groupid: 'users',
          comment: 'Regular users with limited access',
          members: ['user1@pve'],
        },
        {
          groupid: 'backup',
          comment: 'Backup operators',
          members: ['backup@pve'],
        },
      ];

      const mockRoles: ProxmoxRole[] = [
        {
          roleid: 'Administrator',
          privs: ['*'],
        },
        {
          roleid: 'VMUser',
          privs: ['VM.Console', 'VM.PowerMgmt', 'VM.Monitor'],
        },
        {
          roleid: 'BackupOperator',
          privs: ['Datastore.Backup', 'VM.Backup'],
        },
      ];

      setUsers(mockUsers);
      setGroups(mockGroups);
      setRoles(mockRoles);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTab === 'users') {
      const userData: ProxmoxUser = {
        userid: `${formData.userid}@${formData.realm}`,
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        groups: formData.groups,
        enable: formData.enable,
        comment: formData.comment,
      };

      if (editingItem) {
        setUsers(users.map(user => 
          user.userid === editingItem.userid ? userData : user
        ));
      } else {
        setUsers([...users, userData]);
      }
    }

    setShowCreateModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      userid: '',
      password: '',
      firstname: '',
      lastname: '',
      email: '',
      groups: [],
      enable: true,
      comment: '',
      realm: 'pve',
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (selectedTab === 'users') {
      const [username, realm] = item.userid.split('@');
      setFormData({
        userid: username,
        password: '',
        firstname: item.firstname || '',
        lastname: item.lastname || '',
        email: item.email || '',
        groups: item.groups || [],
        enable: item.enable,
        comment: item.comment || '',
        realm: realm || 'pve',
      });
    }
    setShowCreateModal(true);
  };

  const handleDelete = (itemId: string) => {
    if (confirm(`Are you sure you want to delete ${itemId}?`)) {
      if (selectedTab === 'users') {
        setUsers(users.filter(user => user.userid !== itemId));
      } else if (selectedTab === 'groups') {
        setGroups(groups.filter(group => group.groupid !== itemId));
      }
    }
  };

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  User ID
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Groups
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.userid}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-3 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.userid}</div>
                        {user.comment && (
                          <div className="text-sm text-gray-500">{user.comment}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {user.firstname} {user.lastname}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.groups?.map((group) => (
                        <span key={group} className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                          {group}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={user.enable ? 'status-running' : 'status-stopped'}>
                      {user.enable ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.userid)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderGroupsTab = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Groups</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.groupid} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{group.groupid}</h4>
                    {group.comment && (
                      <p className="text-sm text-gray-500">{group.comment}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleEdit(group)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(group.groupid)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-500">Members ({group.members?.length || 0})</p>
                <div className="space-y-1">
                  {group.members?.slice(0, 3).map((member) => (
                    <div key={member} className="text-sm text-gray-700">{member}</div>
                  ))}
                  {(group.members?.length || 0) > 3 && (
                    <div className="text-sm text-gray-500">+{(group.members?.length || 0) - 3} more</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRolesTab = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Roles</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div key={role.roleid} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <Key className="w-6 h-6 mr-2 text-green-600" />
                  <h4 className="font-medium text-gray-900">{role.roleid}</h4>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-500">Privileges ({role.privs.length})</p>
                <div className="space-y-1">
                  {role.privs.slice(0, 5).map((priv) => (
                    <div key={priv} className="px-2 py-1 text-sm text-gray-700 rounded bg-gray-50">
                      {priv}
                    </div>
                  ))}
                  {role.privs.length > 5 && (
                    <div className="text-sm text-gray-500">+{role.privs.length - 5} more</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <div className="flex items-center space-x-4">
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setSelectedTab('users')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'users'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setSelectedTab('groups')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'groups'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Groups
            </button>
            <button
              onClick={() => setSelectedTab('roles')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'roles'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Roles
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create {selectedTab.slice(0, -1)}</span>
          </button>
          <button
            onClick={fetchUserData}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {selectedTab === 'users' && renderUsersTab()}
          {selectedTab === 'groups' && renderGroupsTab()}
          {selectedTab === 'roles' && renderRolesTab()}
        </>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && selectedTab === 'users' && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {editingItem ? 'Edit User' : 'Create New User'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={formData.userid}
                      onChange={(e) => setFormData(prev => ({ ...prev, userid: e.target.value }))}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Realm</label>
                    <select
                      value={formData.realm}
                      onChange={(e) => setFormData(prev => ({ ...prev, realm: e.target.value }))}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pve">Proxmox VE</option>
                      <option value="pam">Linux PAM</option>
                      <option value="ad">Active Directory</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="block w-full px-3 py-2 pr-10 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required={!editingItem}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={formData.firstname}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastname}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enable"
                    checked={formData.enable}
                    onChange={(e) => setFormData(prev => ({ ...prev, enable: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enable" className="block ml-2 text-sm text-gray-700">
                    Enable user account
                  </label>
                </div>
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingItem ? 'Update' : 'Create'} User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;