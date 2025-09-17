import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  UserCheck,
  UserX,
  X,
  Save
} from 'lucide-react';
import { User } from '../../types';
import toast from 'react-hot-toast';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    department: '',
    position: '',
    salary: '',
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.hr.getEmployees(pagination.page, pagination.limit);
      setEmployees(response.data.employees);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.employeeProfile?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.employeeProfile?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.employeeProfile?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'ALL' || emp.employeeProfile?.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const getDepartments = () => {
    const departments = new Set(employees.map(emp => emp.employeeProfile?.department).filter(Boolean));
    return Array.from(departments);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.auth.createEmployee(formData);
      setEmployees([response.data.user, ...employees]);
      setShowCreateModal(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        department: '',
        position: '',
        salary: '',
      });
      toast.success('Employee created successfully');
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      toast.error(error.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const response = await api.hr.updateEmployee(editingEmployee.id, formData);
      setEmployees(employees.map(emp => 
        emp.id === editingEmployee.id ? response.data : emp
      ));
      setEditingEmployee(null);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        department: '',
        position: '',
        salary: '',
      });
      toast.success('Employee updated successfully');
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      toast.error(error.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleToggleStatus = async (employeeId: string, isActive: boolean) => {
    try {
      // Implement toggle user status API call
      console.log('Toggle employee status:', employeeId, isActive);
      setEmployees(employees.map(emp => 
        emp.id === employeeId 
          ? { 
              ...emp, 
              employeeProfile: emp.employeeProfile ? { 
                ...emp.employeeProfile, 
                isActive 
              } : undefined 
            }
          : emp
      ));
      toast.success(`Employee ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Failed to toggle employee status:', error);
      toast.error(error.response?.data?.message || 'Failed to update employee status');
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.hr.deleteEmployee(employeeId);
        setEmployees(employees.filter(emp => emp.id !== employeeId));
        toast.success('Employee deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete employee:', error);
        toast.error(error.response?.data?.message || 'Failed to delete employee');
      }
    }
  };

  const handleEdit = (employee: User) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email,
      password: '',
      firstName: employee.employeeProfile?.firstName || '',
      lastName: employee.employeeProfile?.lastName || '',
      phone: employee.employeeProfile?.phone || '',
      address: employee.employeeProfile?.address || '',
      department: employee.employeeProfile?.department || '',
      position: employee.employeeProfile?.position || '',
      salary: employee.employeeProfile?.salary?.toString() || '',
    });
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setEditingEmployee(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      department: '',
      position: '',
      salary: '',
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage employee information and status</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Employee
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
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="input"
              >
                <option value="ALL">All Departments</option>
                {getDepartments().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
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
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.employeeProfile?.firstName} {employee.employeeProfile?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.employeeProfile?.employeeId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.employeeProfile?.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.employeeProfile?.position || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.employeeProfile?.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.employeeProfile?.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEdit(employee)}
                          className="p-1 text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(employee.id, !employee.employeeProfile?.isActive)}
                          className={`p-1 ${
                            employee.employeeProfile?.isActive !== false
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={employee.employeeProfile?.isActive !== false ? 'Deactivate' : 'Activate'}
                        >
                          {employee.employeeProfile?.isActive !== false ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="p-1 text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Employee Modal */}
      {(showCreateModal || editingEmployee) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input 
                    type="email" 
                    className="input" 
                    placeholder="employee@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                {!editingEmployee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input 
                      type="password" 
                      className="input" 
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingEmployee}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select 
                    className="input"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">Human Resources</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary</label>
                  <input 
                    type="number" 
                    className="input" 
                    placeholder="Salary"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    {editingEmployee ? 'Update' : 'Add'} Employee
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

export default Employees;