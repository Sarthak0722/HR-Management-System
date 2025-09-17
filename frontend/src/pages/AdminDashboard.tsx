import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { 
  Users, 
  Building2, 
  Settings, 
  BarChart3, 
  Clock, 
  Bell,
  TrendingUp,
  UserCheck,
  Calendar,
  DollarSign
} from 'lucide-react';

interface AdminStats {
  totalUsers?: number;
  totalEmployees?: number;
  totalDepartments?: number;
  totalPositions?: number;
  pendingLeaves?: number;
  todayAttendance?: number;
  unreadNotifications?: number;
  monthlyExpenses?: number;
  recentHires?: number;
  employeesByDepartment?: Array<{
    department: string;
    count: number;
  }>;
  attendanceStats?: {
    present: number;
    absent: number;
    late: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from APIs
        const [departmentsResponse, leavesResponse, notificationsResponse] = await Promise.all([
          api.departments.getAll(1, 100),
          api.leaves.getAll(1, 100, 'PENDING'),
          api.notifications.getUnreadCount()
        ]);

        const departments = departmentsResponse.data.departments;
        const pendingLeaves = leavesResponse.data.leaves;
        const unreadNotifications = notificationsResponse.data.unreadCount;

        // Calculate department employee counts
        const employeesByDepartment = departments.map((dept: any) => ({
          department: dept.name,
          count: dept.employeeCount || 0
        }));

        // Get total users count from departments stats
        const totalUsers = departments.reduce((sum: number, dept: any) => sum + (dept.employeeCount || 0), 0);
        const totalEmployees = totalUsers; // Same as users since all have profiles

        setStats({
          totalUsers: totalUsers,
          totalEmployees: totalEmployees,
          totalDepartments: departments.length,
          pendingLeaves: pendingLeaves.length,
          unreadNotifications: unreadNotifications,
          employeesByDepartment: employeesByDepartment,
          // Set other stats to 0 since we don't have attendance system yet
          totalPositions: 0,
          todayAttendance: 0,
          monthlyExpenses: 0,
          recentHires: 0,
          attendanceStats: {
            present: 0,
            absent: 0,
            late: 0,
          },
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        // Set default values on error
        setStats({
          totalUsers: 0,
          totalEmployees: 0,
          totalDepartments: 0,
          pendingLeaves: 0,
          unreadNotifications: 0,
          employeesByDepartment: [],
          totalPositions: 0,
          todayAttendance: 0,
          monthlyExpenses: 0,
          recentHires: 0,
          attendanceStats: {
            present: 0,
            absent: 0,
            late: 0,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.employeeProfile?.firstName}!
        </h1>
        <p className="text-gray-600">
          Here's your system overview and management dashboard.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalUsers || 0}
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
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Employees
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
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Departments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalDepartments || 0}
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
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Attendance
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.todayAttendance || 0}
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
                <Bell className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Unread Notifications
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.unreadNotifications || 0}
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
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Monthly Expenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${(stats.monthlyExpenses || 0).toLocaleString()}
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
                <TrendingUp className="h-8 w-8 text-blue-600" />
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
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Department Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Employees by Department</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {stats.employeesByDepartment?.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${(dept.count / (stats.totalEmployees || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8">{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Today's Attendance</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">Present</span>
                </div>
                <span className="text-sm text-gray-500">{stats.attendanceStats?.present || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">Absent</span>
                </div>
                <span className="text-sm text-gray-500">{stats.attendanceStats?.absent || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">Late</span>
                </div>
                <span className="text-sm text-gray-500">{stats.attendanceStats?.late || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/users"
              className="btn btn-primary text-center"
            >
              <Users className="h-5 w-5 mr-2" />
              Manage Users
            </a>
            <a
              href="/admin/departments"
              className="btn btn-secondary text-center"
            >
              <Building2 className="h-5 w-5 mr-2" />
              Departments
            </a>
            <a
              href="/admin/settings"
              className="btn btn-secondary text-center"
            >
              <Settings className="h-5 w-5 mr-2" />
              System Settings
            </a>
            <a
              href="/admin/reports"
              className="btn btn-secondary text-center"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Reports
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
