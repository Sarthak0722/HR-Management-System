import { UserRole, LeaveStatus, LeaveType } from '@prisma/client';

export interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  salary?: number;
  hireDate?: Date;
}

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface CreateLeaveRequest {
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export { UserRole, LeaveStatus, LeaveType };
