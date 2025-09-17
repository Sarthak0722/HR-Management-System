import { UserRole, LeaveStatus, LeaveType } from '@prisma/client';

export interface Employee {
  id: string;
  email: string;
  role: UserRole;
  employeeProfile: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    department?: string;
    position?: string;
    salary?: number;
    hireDate?: Date;
  };
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    employeeProfile: {
      firstName: string;
      lastName: string;
      department?: string;
    };
  };
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

export interface LeaveApprovalRequest {
  status: LeaveStatus;
  approvedBy: string;
}

export { UserRole, LeaveStatus, LeaveType };
