import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QA from './pages/QA';
// import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import SystemSettings from './pages/admin/SystemSettings';
import PayrollManagement from './pages/admin/PayrollManagement';
import PerformanceManagement from './pages/admin/PerformanceManagement';
import TrainingManagement from './pages/admin/TrainingManagement';
import Profile from './pages/employee/Profile';
import EmployeeLeaves from './pages/employee/Leaves';
import Employees from './pages/hr/Employees';
import HRLeaves from './pages/hr/Leaves';
import HRPayroll from './pages/hr/Payroll';
import HRPerformance from './pages/hr/Performance';
import HRTraining from './pages/hr/Training';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (isAuthenticated) {
    // Redirect based on role
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/users" replace />;
    } else if (user?.role === 'HR') {
      return <Navigate to="/hr/employees" replace />;
    } else {
      return <Navigate to="/employee/profile" replace />;
    }
  }
  
  return <>{children}</>;
};

// Role-based Route Component
const RoleRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: string[] 
}> = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* HR Routes */}
          <Route
            path="/hr/employees"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['HR', 'ADMIN']}>
                  <Layout>
                    <Employees />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/leaves"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['HR', 'ADMIN']}>
                  <Layout>
                    <HRLeaves />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/payroll"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['HR', 'ADMIN']}>
                  <Layout>
                    <HRPayroll />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/performance"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['HR', 'ADMIN']}>
                  <Layout>
                    <HRPerformance />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/training"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['HR', 'ADMIN']}>
                  <Layout>
                    <HRTraining />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/leaves"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployeeLeaves />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <Layout>
                    <DepartmentManagement />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <Layout>
                    <SystemSettings />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payroll"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <Layout>
                    <PayrollManagement />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/performance"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <Layout>
                    <PerformanceManagement />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/training"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <Layout>
                    <TrainingManagement />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <Layout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                      <p className="text-gray-600 mt-2">Advanced reporting functionality coming soon...</p>
                    </div>
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* QA Route */}
          <Route
            path="/qa"
            element={
              <ProtectedRoute>
                <Layout>
                  <QA />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Page Not Found</h2>
                    <p className="text-gray-600 mt-2">The page you're looking for doesn't exist.</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
