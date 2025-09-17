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
}

export const api = new ApiClient();
export default api;
