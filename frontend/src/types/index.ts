export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  employeeProfile?: EmployeeProfile;
}

export interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  salary?: number;
  hireDate?: string;
  employeeId?: string;
  isActive?: boolean;
}

export interface LeaveRequest {
  id: string;
  type: 'SICK_LEAVE' | 'VACATION' | 'PERSONAL_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    employeeProfile?: {
      firstName: string;
      lastName: string;
      department?: string;
    };
  };
}

export interface CreateLeaveRequest {
  type: 'SICK_LEAVE' | 'VACATION' | 'PERSONAL_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE';
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export interface CreateEmployeeRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  salary?: number;
  hireDate?: string;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  salary?: number;
}

export interface QAResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
  }>;
  confidence: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  manager?: EmployeeProfile;
  employees?: EmployeeProfile[];
  positions?: Position[];
  employeeCount?: number;
  positionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  title: string;
  departmentId: string;
  department?: Department;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
  employees?: EmployeeProfile[];
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  user?: User;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'WORK_FROM_HOME';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  user?: User;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'LEAVE_APPROVAL' | 'LEAVE_REJECTION' | 'ATTENDANCE_REMINDER';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
  leavePolicy?: {
    annualLeave: number;
    sickLeave: number;
    personalLeave: number;
    maternityLeave: number;
    paternityLeave: number;
  };
  createdAt: string;
  updatedAt: string;
}
