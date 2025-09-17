import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { UpdateEmployeeRequest } from '../types';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().positive().optional(),
});

export const getAllEmployees = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [employees, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      include: { 
        employeeProfile: {
          include: {
            department: true,
            position: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({
      where: { role: 'EMPLOYEE' },
    }),
  ]);

  res.json({
    employees: employees.map(emp => ({
      id: emp.id,
      email: emp.email,
      role: emp.role,
      employeeProfile: emp.employeeProfile ? {
        ...emp.employeeProfile,
        department: emp.employeeProfile.department?.name || undefined,
        position: emp.employeeProfile.position?.title || undefined,
      } : undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const employee = await prisma.user.findUnique({
    where: { id, role: 'EMPLOYEE' },
    include: { 
      employeeProfile: {
        include: {
          department: true,
          position: true
        }
      }
    },
  });

  if (!employee) {
    throw createError('Employee not found', 404);
  }

  res.json({
    id: employee.id,
    email: employee.email,
    role: employee.role,
    employeeProfile: employee.employeeProfile ? {
      ...employee.employeeProfile,
      department: employee.employeeProfile.department?.name || undefined,
      position: employee.employeeProfile.position?.title || undefined,
    } : undefined,
  });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = updateEmployeeSchema.parse(req.body);

  // Check if employee exists
  const existingEmployee = await prisma.user.findUnique({
    where: { id, role: 'EMPLOYEE' },
    include: { employeeProfile: true },
  });

  if (!existingEmployee) {
    throw createError('Employee not found', 404);
  }

  // Handle department and position separately
  const { department, position, ...otherData } = updateData;
  
  let departmentId = undefined;
  let positionId = undefined;

  if (department) {
    let departmentRecord = await prisma.department.findFirst({
      where: { name: department }
    });
    if (!departmentRecord) {
      departmentRecord = await prisma.department.create({
        data: { name: department }
      });
    }
    departmentId = departmentRecord.id;
  }

  if (position && departmentId) {
    let positionRecord = await prisma.position.findFirst({
      where: { 
        title: position,
        departmentId: departmentId
      }
    });
    if (!positionRecord) {
      positionRecord = await prisma.position.create({
        data: { 
          title: position,
          departmentId: departmentId
        }
      });
    }
    positionId = positionRecord.id;
  }

  // Update employee profile
  const updatedEmployee = await prisma.user.update({
    where: { id },
    data: {
      employeeProfile: {
        update: {
          ...otherData,
          ...(departmentId && { departmentId }),
          ...(positionId && { positionId }),
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

  logger.info('Employee updated by HR', {
    hrUserId: (req as AuthenticatedRequest).user?.userId,
    employeeId: id,
    updateData,
  });

  res.json({
    id: updatedEmployee.id,
    email: updatedEmployee.email,
    role: updatedEmployee.role,
    employeeProfile: updatedEmployee.employeeProfile ? {
      ...updatedEmployee.employeeProfile,
      department: updatedEmployee.employeeProfile.department?.name || undefined,
      position: updatedEmployee.employeeProfile.position?.title || undefined,
    } : undefined,
  });
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if employee exists
  const existingEmployee = await prisma.user.findUnique({
    where: { id, role: 'EMPLOYEE' },
  });

  if (!existingEmployee) {
    throw createError('Employee not found', 404);
  }

  // Delete employee (cascade will delete profile)
  await prisma.user.delete({
    where: { id },
  });

  logger.info('Employee deleted by HR', {
    hrUserId: (req as AuthenticatedRequest).user?.userId,
    employeeId: id,
  });

  res.json({ message: 'Employee deleted successfully' });
});

export const getEmployeeStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalEmployees,
    employeesByDepartment,
    recentHires,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: 'EMPLOYEE' },
    }),
    prisma.employeeProfile.groupBy({
      by: ['departmentId'],
      _count: { departmentId: true },
      where: { departmentId: { not: null } },
    }),
    prisma.user.count({
      where: {
        role: 'EMPLOYEE',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  // Get department names for the grouped data
  const departmentIds = employeesByDepartment
    .map(dept => dept.departmentId)
    .filter((id): id is string => id !== null);
  
  const departments = departmentIds.length > 0 ? await prisma.department.findMany({
    where: { id: { in: departmentIds } },
    select: { id: true, name: true }
  }) : [];

  const departmentMap = new Map(departments.map(dept => [dept.id, dept.name]));

  res.json({
    totalEmployees,
    employeesByDepartment: employeesByDepartment.map(dept => ({
      department: dept.departmentId ? departmentMap.get(dept.departmentId) || 'Unknown' : 'No Department',
      count: dept._count.departmentId,
    })),
    recentHires,
  });
});
