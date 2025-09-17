import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { LoginRequest, RegisterRequest, CreateEmployeeRequest, AuthResponse } from '../types';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .refine((email) => !email.includes('000') && email !== '000@00.com', {
      message: 'Invalid email format'
    })
    .refine((email) => {
      const domain = email.split('@')[1];
      return domain && domain.length > 3 && !domain.includes('00');
    }, {
      message: 'Invalid email domain'
    }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must be less than 50 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .refine((password) => !password.includes('000'), {
      message: 'Password cannot contain "000"'
    }),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
    .refine((name) => !name.includes('000'), {
      message: 'First name cannot contain "000"'
    }),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
    .refine((name) => !name.includes('000'), {
      message: 'Last name cannot contain "000"'
    }),
  department: z.string()
    .min(2, 'Department must be at least 2 characters')
    .max(100, 'Department must be less than 100 characters')
    .optional(),
  position: z.string()
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position must be less than 100 characters')
    .optional(),
  salary: z.number()
    .min(0, 'Salary cannot be negative')
    .max(1000000, 'Salary cannot exceed $1,000,000')
    .optional(),
});

const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  salary: z.union([z.number().positive(), z.string().transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) throw new Error('Invalid salary');
    return num;
  })]).optional(),
  hireDate: z.string().datetime().optional(),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { 
      employeeProfile: {
        include: {
          department: true,
          position: true
        }
      }
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const response: AuthResponse = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeProfile: user.employeeProfile ? {
        firstName: user.employeeProfile.firstName,
        lastName: user.employeeProfile.lastName,
        department: user.employeeProfile.department?.name || undefined,
        position: user.employeeProfile.position?.title || undefined,
      } : undefined,
    },
    token,
  };

  logger.info('User logged in successfully', { userId: user.id, email: user.email });
  res.json(response);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, department, position, salary } = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw createError('User already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Find or create department
  let departmentRecord = null;
  if (department) {
    departmentRecord = await prisma.department.findFirst({
      where: { name: department }
    });
    if (!departmentRecord) {
      departmentRecord = await prisma.department.create({
        data: { name: department }
      });
    }
  }

  // Find or create position
  let positionRecord = null;
  if (position && departmentRecord) {
    positionRecord = await prisma.position.findFirst({
      where: { 
        title: position,
        departmentId: departmentRecord.id
      }
    });
    if (!positionRecord) {
      positionRecord = await prisma.position.create({
        data: { 
          title: position,
          departmentId: departmentRecord.id
        }
      });
    }
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      employeeProfile: {
        create: {
          firstName,
          lastName,
          departmentId: departmentRecord?.id,
          positionId: positionRecord?.id,
          salary,
          hireDate: new Date(),
        },
      },
    },
    include: { 
      employeeProfile: {
        include: {
          department: true,
          position: true
        }
      }
    },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const response: AuthResponse = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeProfile: {
        firstName: user.employeeProfile!.firstName,
        lastName: user.employeeProfile!.lastName,
        department: user.employeeProfile!.department?.name || undefined,
        position: user.employeeProfile!.position?.title || undefined,
      },
    },
    token,
  };

  logger.info('User registered successfully', { userId: user.id, email: user.email });
  res.status(201).json(response);
});

export const createEmployee = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, firstName, lastName, phone, address, department, position, salary, hireDate } = createEmployeeSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw createError('User already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Find or create department
  let departmentRecord = null;
  if (department) {
    departmentRecord = await prisma.department.findFirst({
      where: { name: department }
    });
    if (!departmentRecord) {
      departmentRecord = await prisma.department.create({
        data: { name: department }
      });
    }
  }

  // Find or create position
  let positionRecord = null;
  if (position && departmentRecord) {
    positionRecord = await prisma.position.findFirst({
      where: { 
        title: position,
        departmentId: departmentRecord.id
      }
    });
    if (!positionRecord) {
      positionRecord = await prisma.position.create({
        data: { 
          title: position,
          departmentId: departmentRecord.id
        }
      });
    }
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      employeeProfile: {
        create: {
          firstName,
          lastName,
          phone,
          address,
          departmentId: departmentRecord?.id,
          positionId: positionRecord?.id,
          salary,
          hireDate: hireDate ? new Date(hireDate) : new Date(),
        },
      },
    },
    include: { 
      employeeProfile: {
        include: {
          department: true,
          position: true
        }
      }
    },
  });

  logger.info('Employee created by HR', { 
    createdBy: req.user?.userId, 
    newEmployeeId: user.id, 
    email: user.email 
  });

  res.status(201).json({
    message: 'Employee created successfully',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeProfile: {
        firstName: user.employeeProfile!.firstName,
        lastName: user.employeeProfile!.lastName,
        department: user.employeeProfile!.department?.name || undefined,
        position: user.employeeProfile!.position?.title || undefined,
      },
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { 
      employeeProfile: {
        include: {
          department: true,
          position: true
        }
      }
    },
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeProfile: user.employeeProfile ? {
        ...user.employeeProfile,
        department: user.employeeProfile.department?.name || undefined,
        position: user.employeeProfile.position?.title || undefined,
      } : undefined,
    },
  });
});
