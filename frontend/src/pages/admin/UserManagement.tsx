import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Search,
  UserCheck,
  UserX,
  MoreVertical
} from 'lucide-react';
import { User } from '../../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@company.com',
          role: 'ADMIN',
          employeeProfile: {
            id: '1',
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+1234567890',
            employeeId: 'ADM001',
            salary: 100000,
            hireDate: '2023-01-01',
          }
        },
        {
          id: '2',
          email: 'hr@company.com',
          role: 'HR',
          employeeProfile: {
            id: '2',
            firstName: 'HR',
            lastName: 'Manager',
            phone: '+1234567891',
            employeeId: 'HR001',
            salary: 80000,
            hireDate: '2023-01-01',
          }
        },
        {
          id: '3',
          email: 'employee@company.com',
          role: 'EMPLOYEE',
          employeeProfile: {
            id: '3',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567892',
            employeeId: 'EMP001',
            salary: 70000,
            hireDate: '2023-06-01',
          }
        },
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employeeProfile?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employeeProfile?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'HR':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      // Implement toggle user status API call
      console.log('Toggle user status:', userId, isActive);
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              employeeProfile: user.employeeProfile ? { 
                ...user.employeeProfile, 
                isActive 
              } : undefined 
            }
          : user
      ));
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="HR">HR</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.employeeProfile?.firstName} {user.employeeProfile?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.employeeProfile?.employeeId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.employeeProfile?.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.employeeProfile?.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.employeeProfile?.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, !user.employeeProfile?.isActive)}
                          className={`p-1 rounded ${
                            user.employeeProfile?.isActive !== false
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={user.employeeProfile?.isActive !== false ? 'Deactivate' : 'Activate'}
                        >
                          {user.employeeProfile?.isActive !== false ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button className="p-1 text-blue-600 hover:text-blue-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" className="input" placeholder="user@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" className="input" placeholder="Password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select className="input">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input type="text" className="input" placeholder="First Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input type="text" className="input" placeholder="Last Name" />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create User
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

export default UserManagement;
