import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { Users, Calendar, User, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalEmployees?: number;
  pendingLeaves?: number;
  approvedLeaves?: number;
  rejectedLeaves?: number;
  totalLeaves?: number;
  recentHires?: number;
  totalDepartments?: number;
  unreadNotifications?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === 'ADMIN') {
          // Fetch admin stats
          const [departmentsResponse, leavesResponse, notificationsResponse] = await Promise.all([
            api.departments.getAll(1, 100),
            api.leaves.getAll(1, 100, 'PENDING'),
            api.notifications.getUnreadCount()
          ]);

          const departments = departmentsResponse.data.departments;
          const pendingLeaves = leavesResponse.data.leaves;
          const unreadNotifications = notificationsResponse.data.unreadCount;

          // Get total users count from departments stats
          const totalUsers = departments.reduce((sum: number, dept: any) => sum + (dept.employeeCount || 0), 0);

          setStats({
            totalEmployees: totalUsers,
            pendingLeaves: pendingLeaves.length,
            totalDepartments: departments.length,
            unreadNotifications: unreadNotifications,
          });
        } else if (user?.role === 'HR') {
          const [employeeStats, leaveStats] = await Promise.all([
            api.hr.getEmployeeStats(),
            api.hr.getLeaveStats(),
          ]);
          
          setStats({
            ...employeeStats.data,
            ...leaveStats.data,
          });
        } else {
          const leaveStats = await api.employee.getLeaveStats();
          setStats(leaveStats.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isHR = user?.role === 'HR';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.employeeProfile?.firstName}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening in your {isAdmin ? 'admin' : isHR ? 'HR' : 'employee'} dashboard.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin ? (
          <>
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalEmployees || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Leaves
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pendingLeaves || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Employees
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalEmployees || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Departments
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalDepartments || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : isHR ? (
          <>
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Employees
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalEmployees || 0}
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
                    <Calendar className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Leaves
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.pendingLeaves || 0}
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
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recent Hires
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.recentHires || 0}
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
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Approved Leaves
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.approvedLeaves || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Leaves
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalLeaves || 0}
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
                    <Calendar className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Leaves
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.pendingLeaves || 0}
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
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Approved Leaves
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.approvedLeaves || 0}
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
                    <User className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Rejected Leaves
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.rejectedLeaves || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>


      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isAdmin ? (
              <>
                <a
                  href="/admin/users"
                  className="btn btn-primary text-center"
                >
                  Manage Users
                </a>
                <a
                  href="/admin/departments"
                  className="btn btn-secondary text-center"
                >
                  Manage Departments
                </a>
                <a
                  href="/admin/settings"
                  className="btn btn-secondary text-center"
                >
                  System Settings
                </a>
              </>
            ) : isHR ? (
              <>
                <a
                  href="/hr/employees"
                  className="btn btn-primary text-center"
                >
                  Manage Employees
                </a>
                <a
                  href="/hr/leaves"
                  className="btn btn-secondary text-center"
                >
                  Review Leave Requests
                </a>
                <a
                  href="/qa"
                  className="btn btn-secondary text-center"
                >
                  HR Assistant
                </a>
              </>
            ) : (
              <>
                <a
                  href="/employee/profile"
                  className="btn btn-primary text-center"
                >
                  Update Profile
                </a>
                <a
                  href="/employee/leaves"
                  className="btn btn-secondary text-center"
                >
                  Request Leave
                </a>
                <a
                  href="/qa"
                  className="btn btn-secondary text-center"
                >
                  Ask HR Assistant
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
