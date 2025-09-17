import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URLS = {
  auth: process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:3001',
  hr: process.env.REACT_APP_HR_SERVICE_URL || 'http://localhost:3002',
  employee: process.env.REACT_APP_EMPLOYEE_SERVICE_URL || 'http://localhost:3003',
  rag: process.env.REACT_APP_RAG_SERVICE_URL || 'http://localhost:3004',
};

class ApiClient {
  private authClient: AxiosInstance;
  private hrClient: AxiosInstance;
  private employeeClient: AxiosInstance;
  private ragClient: AxiosInstance;

  constructor() {
    this.authClient = this.createClient(API_BASE_URLS.auth);
    this.hrClient = this.createClient(API_BASE_URLS.hr);
    this.employeeClient = this.createClient(API_BASE_URLS.employee);
    this.ragClient = this.createClient(API_BASE_URLS.rag);
  }

  private createClient(baseURL: string): AxiosInstance {
    const client = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return client;
  }

  // Auth API
  get auth() {
    return {
      login: (email: string, password: string) =>
        this.authClient.post('/auth/login', { email, password }),
      
      register: (data: any) =>
        this.authClient.post('/auth/register', data),
      
      createEmployee: (data: any) =>
        this.authClient.post('/auth/employee', data),
      
      logout: () =>
        this.authClient.post('/auth/logout'),
      
      getProfile: () =>
        this.authClient.get('/auth/profile'),
    };
  }

  // Notification API
  get notifications() {
    return {
      getAll: (page = 1, limit = 10) =>
        this.authClient.get(`/notifications?page=${page}&limit=${limit}`),
      
      getUnreadCount: () =>
        this.authClient.get('/notifications/unread-count'),
      
      markAsRead: (notificationId: string) =>
        this.authClient.put(`/notifications/${notificationId}/read`),
      
      markAllAsRead: () =>
        this.authClient.put('/notifications/mark-all-read'),
      
      delete: (notificationId: string) =>
        this.authClient.delete(`/notifications/${notificationId}`),
      
      create: (data: any) =>
        this.authClient.post('/notifications', data),
    };
  }

  // Department API
  get departments() {
    return {
      getAll: (page = 1, limit = 10) =>
        this.authClient.get(`/departments?page=${page}&limit=${limit}`),
      
      getById: (id: string) =>
        this.authClient.get(`/departments/${id}`),
      
      create: (data: any) =>
        this.authClient.post('/departments', data),
      
      update: (id: string, data: any) =>
        this.authClient.put(`/departments/${id}`, data),
      
      delete: (id: string) =>
        this.authClient.delete(`/departments/${id}`),
      
      getStats: () =>
        this.authClient.get('/departments/stats'),
    };
  }

  // Leave API
  get leaves() {
    return {
      create: (data: any) =>
        this.authClient.post('/leaves', data),
      
      getMy: (page = 1, limit = 10, status?: string) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (status) params.append('status', status);
        return this.authClient.get(`/leaves/my?${params}`);
      },
      
      getAll: (page = 1, limit = 10, status?: string) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (status) params.append('status', status);
        return this.authClient.get(`/leaves?${params}`);
      },
      
      updateStatus: (id: string, data: any) =>
        this.authClient.put(`/leaves/${id}/status`, data),
      
      delete: (id: string) =>
        this.authClient.delete(`/leaves/${id}`),
      
      getStats: (userId?: string) => {
        const params = userId ? `?userId=${userId}` : '';
        return this.authClient.get(`/leaves/stats${params}`);
      },
    };
  }

  // HR API
  get hr() {
    return {
      getEmployees: (page = 1, limit = 10) =>
        this.hrClient.get(`/hr/employees?page=${page}&limit=${limit}`),
      
      getEmployee: (id: string) =>
        this.hrClient.get(`/hr/employees/${id}`),
      
      updateEmployee: (id: string, data: any) =>
        this.hrClient.put(`/hr/employees/${id}`, data),
      
      deleteEmployee: (id: string) =>
        this.hrClient.delete(`/hr/employees/${id}`),
      
      getEmployeeStats: () =>
        this.hrClient.get('/hr/employees/stats'),
      
      getLeaves: (page = 1, limit = 10, status?: string) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (status) params.append('status', status);
        return this.hrClient.get(`/hr/leaves?${params}`);
      },
      
      getLeave: (id: string) =>
        this.hrClient.get(`/hr/leaves/${id}`),
      
      approveLeave: (id: string, status: 'APPROVED' | 'REJECTED') =>
        this.hrClient.put(`/hr/leaves/${id}/approve`, { status }),
      
      getLeaveStats: () =>
        this.hrClient.get('/hr/leaves/stats'),
    };
  }

  // Employee API
  get employee() {
    return {
      getProfile: () =>
        this.employeeClient.get('/employee/profile'),
      
      updateProfile: (data: any) =>
        this.employeeClient.put('/employee/profile', data),
      
      getLeaves: (page = 1, limit = 10) =>
        this.employeeClient.get(`/employee/leaves?page=${page}&limit=${limit}`),
      
      getLeave: (id: string) =>
        this.employeeClient.get(`/employee/leaves/${id}`),
      
      createLeave: (data: any) =>
        this.employeeClient.post('/employee/leaves', data),
      
      updateLeave: (id: string, data: any) =>
        this.employeeClient.put(`/employee/leaves/${id}`, data),
      
      cancelLeave: (id: string) =>
        this.employeeClient.delete(`/employee/leaves/${id}`),
      
      getLeaveStats: () =>
        this.employeeClient.get('/employee/leaves/stats'),
    };
  }

  // RAG API
  get rag() {
    return {
      askQuestion: (question: string, maxResults = 3) =>
        this.ragClient.post('/qa', { question, maxResults }),
      
      getHealth: () =>
        this.ragClient.get('/qa/health'),
      
      getStats: () =>
        this.ragClient.get('/qa/stats'),
    };
  }

  // Payroll API
  get payroll() {
    return {
      create: (data: any) => this.authClient.post('/payroll', data),
      getAll: (page = 1, limit = 10, month?: number, year?: number) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());
        return this.authClient.get(`/payroll?${params}`);
      },
      getById: (id: string) => this.authClient.get(`/payroll/${id}`),
      update: (id: string, data: any) => this.authClient.put(`/payroll/${id}`, data),
      process: (id: string) => this.authClient.post(`/payroll/${id}/process`),
      getStats: (year?: number) => {
        const params = year ? `?year=${year}` : '';
        return this.authClient.get(`/payroll/stats${params}`);
      },
    };
  }

  // Performance API
  get performance() {
    return {
      createReview: (data: any) => this.authClient.post('/performance/reviews', data),
      getReviews: (page = 1, limit = 10, userId?: string, reviewerId?: string) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (userId) params.append('userId', userId);
        if (reviewerId) params.append('reviewerId', reviewerId);
        return this.authClient.get(`/performance/reviews?${params}`);
      },
      getReviewById: (id: string) => this.authClient.get(`/performance/reviews/${id}`),
      updateReview: (id: string, data: any) => this.authClient.put(`/performance/reviews/${id}`, data),
      createGoal: (data: any) => this.authClient.post('/performance/goals', data),
      getGoals: (page = 1, limit = 10, userId?: string, status?: string) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (userId) params.append('userId', userId);
        if (status) params.append('status', status);
        return this.authClient.get(`/performance/goals?${params}`);
      },
      updateGoal: (id: string, data: any) => this.authClient.put(`/performance/goals/${id}`, data),
      getStats: (year?: number) => {
        const params = year ? `?year=${year}` : '';
        return this.authClient.get(`/performance/stats${params}`);
      },
    };
  }

  // Training API
  get training() {
    return {
      createProgram: (data: any) => this.authClient.post('/training/programs', data),
      getPrograms: (page = 1, limit = 10, isActive?: boolean) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (isActive !== undefined) params.append('isActive', isActive.toString());
        return this.authClient.get(`/training/programs?${params}`);
      },
      getProgramById: (id: string) => this.authClient.get(`/training/programs/${id}`),
      updateProgram: (id: string, data: any) => this.authClient.put(`/training/programs/${id}`, data),
      deleteProgram: (id: string) => this.authClient.delete(`/training/programs/${id}`),
      enroll: (data: any) => this.authClient.post('/training/enroll', data),
      getEnrollments: (page = 1, limit = 10, userId?: string, status?: string) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (userId) params.append('userId', userId);
        if (status) params.append('status', status);
        return this.authClient.get(`/training/enrollments?${params}`);
      },
      updateEnrollment: (id: string, data: any) => this.authClient.put(`/training/enrollments/${id}`, data),
      getStats: () => this.authClient.get('/training/stats'),
    };
  }

  // Documents API
  get documents() {
    return {
      upload: (formData: FormData) => this.authClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      getAll: (page = 1, limit = 10, userId?: string, type?: string, isPublic?: boolean) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (userId) params.append('userId', userId);
        if (type) params.append('type', type);
        if (isPublic !== undefined) params.append('isPublic', isPublic.toString());
        return this.authClient.get(`/documents?${params}`);
      },
      getById: (id: string) => this.authClient.get(`/documents/${id}`),
      download: (id: string) => this.authClient.get(`/documents/${id}/download`, { responseType: 'blob' }),
      update: (id: string, data: any) => this.authClient.put(`/documents/${id}`, data),
      delete: (id: string) => this.authClient.delete(`/documents/${id}`),
      getStats: () => this.authClient.get('/documents/stats'),
    };
  }

  // Recruitment API
  get recruitment() {
    return {
      createJob: (data: any) => this.authClient.post('/recruitment/jobs', data),
      getJobs: (page = 1, limit = 10, status?: string, departmentId?: string, employmentType?: string) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (status) params.append('status', status);
        if (departmentId) params.append('departmentId', departmentId);
        if (employmentType) params.append('employmentType', employmentType);
        return this.authClient.get(`/recruitment/jobs?${params}`);
      },
      getJobById: (id: string) => this.authClient.get(`/recruitment/jobs/${id}`),
      updateJob: (id: string, data: any) => this.authClient.put(`/recruitment/jobs/${id}`, data),
      deleteJob: (id: string) => this.authClient.delete(`/recruitment/jobs/${id}`),
      applyForJob: (data: any) => this.authClient.post('/recruitment/applications', data),
      getApplications: (page = 1, limit = 10, jobPostingId?: string, status?: string) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (jobPostingId) params.append('jobPostingId', jobPostingId);
        if (status) params.append('status', status);
        return this.authClient.get(`/recruitment/applications?${params}`);
      },
      updateApplication: (id: string, data: any) => this.authClient.put(`/recruitment/applications/${id}`, data),
      getStats: () => this.authClient.get('/recruitment/stats'),
    };
  }

  // Leave Balances API
  get leaveBalances() {
    return {
      create: (data: any) => this.authClient.post('/leave-balances', data),
      getAll: (page = 1, limit = 10, userId?: string, leaveType?: string, year?: number) => {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (userId) params.append('userId', userId);
        if (leaveType) params.append('leaveType', leaveType);
        if (year) params.append('year', year.toString());
        return this.authClient.get(`/leave-balances?${params}`);
      },
      getById: (id: string) => this.authClient.get(`/leave-balances/${id}`),
      update: (id: string, data: any) => this.authClient.put(`/leave-balances/${id}`, data),
      getUserBalances: (userId: string, year?: number) => {
        const params = year ? `?year=${year}` : '';
        return this.authClient.get(`/leave-balances/user/${userId}${params}`);
      },
      updateUsage: (userId: string, leaveType: string, year: number, days: number) => 
        this.authClient.put(`/leave-balances/usage/${userId}/${leaveType}/${year}`, { days }),
      reset: (year: number) => this.authClient.post(`/leave-balances/reset/${year}`),
      getStats: (year?: number) => {
        const params = year ? `?year=${year}` : '';
        return this.authClient.get(`/leave-balances/stats${params}`);
      },
    };
  }
}

export const api = new ApiClient();
export default api;
