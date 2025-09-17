import { UserRole, LeaveStatus, LeaveType } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  salary?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    employeeProfile?: {
      firstName: string;
      lastName: string;
      department?: string;
      position?: string;
    };
  };
  token: string;
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
  hireDate?: Date;
}

export { UserRole, LeaveStatus, LeaveType };
