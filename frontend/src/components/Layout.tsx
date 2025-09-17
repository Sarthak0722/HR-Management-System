import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { LogOut, User, Users, Calendar, HelpCircle, Home, Settings, Building2, BarChart3, Bell, DollarSign, Target, BookOpen } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.notifications.getUnreadCount();
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        setUnreadCount(0);
      }
    };

    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    ...(user?.role === 'ADMIN' ? [
      { name: 'User Management', href: '/admin/users', icon: Users },
      { name: 'Departments', href: '/admin/departments', icon: Building2 },
      { name: 'Payroll', href: '/admin/payroll', icon: DollarSign },
      { name: 'Performance', href: '/admin/performance', icon: Target },
      { name: 'Training', href: '/admin/training', icon: BookOpen },
      { name: 'System Settings', href: '/admin/settings', icon: Settings },
      { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    ] : user?.role === 'HR' ? [
      { name: 'Employees', href: '/hr/employees', icon: Users },
      { name: 'Leave Requests', href: '/hr/leaves', icon: Calendar },
      { name: 'Payroll', href: '/hr/payroll', icon: DollarSign },
      { name: 'Performance', href: '/hr/performance', icon: Target },
      { name: 'Training', href: '/hr/training', icon: BookOpen },
    ] : [
      { name: 'My Profile', href: '/employee/profile', icon: User },
      { name: 'My Leaves', href: '/employee/leaves', icon: Calendar },
    ]),
    { name: 'HR Assistant', href: '/qa', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">HRMS</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.employeeProfile?.firstName} {user?.employeeProfile?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-1 text-gray-400 hover:text-gray-600"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
};

export default Layout;
