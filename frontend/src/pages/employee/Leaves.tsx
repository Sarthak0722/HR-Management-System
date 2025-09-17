import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Search,
  X,
  Save
} from 'lucide-react';
import { LeaveRequest } from '../../types';
import toast from 'react-hot-toast';

const Leaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: 'VACATION',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const response = await api.leaves.getMy(1, 100, status);
      setLeaves(response.data.leaves);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = leave.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leave.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.leaves.create(formData);
      setLeaves([response.data, ...leaves]);
      setShowCreateModal(false);
      setFormData({ type: 'VACATION', startDate: '', endDate: '', reason: '' });
      toast.success('Leave request submitted successfully');
    } catch (error: any) {
      console.error('Failed to create leave request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await api.leaves.delete(leaveId);
        setLeaves(leaves.filter(leave => leave.id !== leaveId));
        toast.success('Leave request deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete leave request:', error);
        toast.error(error.response?.data?.message || 'Failed to delete leave request');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLeaveType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
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
          <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="text-gray-600">Manage your leave requests and view their status</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Request Leave
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
                  placeholder="Search leaves..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatLeaveType(leave.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {calculateDays(leave.startDate, leave.endDate)} day(s)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {leave.reason || 'No reason provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(leave.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(leave.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {leave.status === 'PENDING' && (
                        <button
                          onClick={() => handleDeleteLeave(leave.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Leave Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Request Leave</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateLeave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                  <select 
                    className="input"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="VACATION">Vacation</option>
                    <option value="SICK_LEAVE">Sick Leave</option>
                    <option value="PERSONAL_LEAVE">Personal Leave</option>
                    <option value="MATERNITY_LEAVE">Maternity Leave</option>
                    <option value="PATERNITY_LEAVE">Paternity Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <textarea 
                    className="input" 
                    rows={3} 
                    placeholder="Reason for leave"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
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
                    <Save className="h-4 w-4 mr-2" />
                    Submit Request
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

export default Leaves;