import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock,
  Search,
  User,
  AlertCircle
} from 'lucide-react';
import { LeaveRequest } from '../../types';
import toast from 'react-hot-toast';

const Leaves: React.FC = () => {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const response = await api.leaves.getAll(1, 100, status);
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
                         leave.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leave.user?.employeeProfile?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leave.user?.employeeProfile?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  const handleApprove = async (leaveId: string) => {
    try {
      await api.leaves.updateStatus(leaveId, { status: 'APPROVED' });
      setLeaves(leaves.map(leave => 
        leave.id === leaveId 
          ? { 
              ...leave, 
              status: 'APPROVED' as const,
              approvedBy: user?.email,
              approvedAt: new Date().toISOString()
            }
          : leave
      ));
      toast.success('Leave request approved');
    } catch (error: any) {
      console.error('Failed to approve leave:', error);
      toast.error(error.response?.data?.message || 'Failed to approve leave request');
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      await api.leaves.updateStatus(leaveId, { status: 'REJECTED' });
      setLeaves(leaves.map(leave => 
        leave.id === leaveId 
          ? { 
              ...leave, 
              status: 'REJECTED' as const,
              approvedBy: user?.email,
              approvedAt: new Date().toISOString()
            }
          : leave
      ));
      toast.success('Leave request rejected');
    } catch (error: any) {
      console.error('Failed to reject leave:', error);
      toast.error(error.response?.data?.message || 'Failed to reject leave request');
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
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Review and manage employee leave requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Requests
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {leaves.filter(l => l.status === 'PENDING').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approved This Month
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {leaves.filter(l => l.status === 'APPROVED').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rejected This Month
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {leaves.filter(l => l.status === 'REJECTED').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
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
                  placeholder="Search leave requests..."
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
                    Employee
                  </th>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {leave.user?.employeeProfile?.firstName} {leave.user?.employeeProfile?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{leave.user?.email}</div>
                          <div className="text-xs text-gray-400">{leave.user?.employeeProfile?.department}</div>
                        </div>
                      </div>
                    </td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {leave.status === 'PENDING' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(leave.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleReject(leave.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {leave.approvedBy && (
                            <div>By: {leave.approvedBy}</div>
                          )}
                          {leave.approvedAt && (
                            <div>On: {new Date(leave.approvedAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaves;