import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Search,
  X,
  Save
} from 'lucide-react';
import { Department } from '../../types';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.departments.getAll();
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.departments.create(formData);
      setDepartments([response.data, ...departments]);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', managerId: '' });
      toast.success('Department created successfully');
    } catch (error: any) {
      console.error('Failed to create department:', error);
      toast.error(error.response?.data?.message || 'Failed to create department');
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;

    try {
      const response = await api.departments.update(editingDepartment.id, formData);
      setDepartments(departments.map(dept => 
        dept.id === editingDepartment.id ? response.data : dept
      ));
      setEditingDepartment(null);
      setFormData({ name: '', description: '', managerId: '' });
      toast.success('Department updated successfully');
    } catch (error: any) {
      console.error('Failed to update department:', error);
      toast.error(error.response?.data?.message || 'Failed to update department');
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.departments.delete(departmentId);
        setDepartments(departments.filter(dept => dept.id !== departmentId));
        toast.success('Department deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete department:', error);
        toast.error(error.response?.data?.message || 'Failed to delete department');
      }
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      managerId: department.managerId || '',
    });
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setEditingDepartment(null);
    setFormData({ name: '', description: '', managerId: '' });
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
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600">Manage company departments and their structure</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Department
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDepartments.map((department) => (
          <div key={department.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building2 className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-500">{department.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => handleEdit(department)}
                    className="p-1 text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteDepartment(department.id)}
                    className="p-1 text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Manager</span>
                  <span className="text-sm text-gray-900">
                    {department.manager ? 
                      `${department.manager.firstName} ${department.manager.lastName}` : 
                      'Not assigned'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Employees</span>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-900">{department.employeeCount || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Positions</span>
                  <span className="text-sm text-gray-900">{department.positionCount || 0}</span>
                </div>
              </div>

              {department.employees && department.employees.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                  <div className="space-y-1">
                    {department.employees.slice(0, 3).map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </span>
                        <span className="text-xs text-gray-500">{employee.employeeId}</span>
                      </div>
                    ))}
                    {department.employees.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{department.employees.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Department Modal */}
      {(showCreateModal || editingDepartment) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingDepartment ? 'Edit Department' : 'Create New Department'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={editingDepartment ? handleUpdateDepartment : handleCreateDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Department Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea 
                    className="input" 
                    rows={3} 
                    placeholder="Department description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manager</label>
                  <select 
                    className="input"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">Select Manager</option>
                    {/* TODO: Load managers from API */}
                    <option value="1">John Smith</option>
                    <option value="2">Jane Doe</option>
                  </select>
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
                    {editingDepartment ? 'Update' : 'Create'} Department
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

export default DepartmentManagement;