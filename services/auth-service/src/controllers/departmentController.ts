import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

export const getAllDepartments = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          }
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          }
        },
        positions: {
          select: {
            id: true,
            title: true,
          }
        },
        _count: {
          select: {
            employees: true,
            positions: true,
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.department.count(),
  ]);

  res.json({
    departments: departments.map(dept => ({
      ...dept,
      employeeCount: dept._count.employees,
      positionCount: dept._count.positions,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        }
      },
      employees: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        }
      },
      positions: {
        select: {
          id: true,
          title: true,
        }
      },
      _count: {
        select: {
          employees: true,
          positions: true,
        }
      }
    },
  });

  if (!department) {
    throw createError('Department not found', 404);
  }

  res.json({
    ...department,
    employeeCount: department._count.employees,
    positionCount: department._count.positions,
  });
});

export const createDepartment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = createDepartmentSchema.parse(req.body);

  // Check if department name already exists
  const existingDepartment = await prisma.department.findFirst({
    where: { name: data.name },
  });

  if (existingDepartment) {
    throw createError('Department with this name already exists', 400);
  }

  // Validate manager if provided
  if (data.managerId) {
    const manager = await prisma.employeeProfile.findUnique({
      where: { id: data.managerId },
    });

    if (!manager) {
      throw createError('Manager not found', 404);
    }
  }

  const department = await prisma.department.create({
    data: {
      name: data.name,
      description: data.description,
      managerId: data.managerId,
    },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        }
      },
      _count: {
        select: {
          employees: true,
          positions: true,
        }
      }
    },
  });

  logger.info('Department created', {
    departmentId: department.id,
    name: department.name,
    createdBy: req.user?.userId,
  });

  res.status(201).json({
    ...department,
    employeeCount: department._count.employees,
    positionCount: department._count.positions,
  });
});

export const updateDepartment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = updateDepartmentSchema.parse(req.body);

  // Check if department exists
  const existingDepartment = await prisma.department.findUnique({
    where: { id },
  });

  if (!existingDepartment) {
    throw createError('Department not found', 404);
  }

  // Check if new name conflicts with existing departments
  if (data.name && data.name !== existingDepartment.name) {
    const nameConflict = await prisma.department.findFirst({
      where: { 
        name: data.name,
        id: { not: id }
      },
    });

    if (nameConflict) {
      throw createError('Department with this name already exists', 400);
    }
  }

  // Validate manager if provided
  if (data.managerId) {
    const manager = await prisma.employeeProfile.findUnique({
      where: { id: data.managerId },
    });

    if (!manager) {
      throw createError('Manager not found', 404);
    }
  }

  const department = await prisma.department.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      managerId: data.managerId,
    },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        }
      },
      _count: {
        select: {
          employees: true,
          positions: true,
        }
      }
    },
  });

  logger.info('Department updated', {
    departmentId: department.id,
    name: department.name,
    updatedBy: req.user?.userId,
  });

  res.json({
    ...department,
    employeeCount: department._count.employees,
    positionCount: department._count.positions,
  });
});

export const deleteDepartment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          employees: true,
          positions: true,
        }
      }
    },
  });

  if (!department) {
    throw createError('Department not found', 404);
  }

  // Check if department has employees or positions
  if (department._count.employees > 0) {
    throw createError('Cannot delete department with employees. Please reassign employees first.', 400);
  }

  if (department._count.positions > 0) {
    throw createError('Cannot delete department with positions. Please delete positions first.', 400);
  }

  await prisma.department.delete({
    where: { id },
  });

  logger.info('Department deleted', {
    departmentId: id,
    name: department.name,
    deletedBy: req.user?.userId,
  });

  res.json({ message: 'Department deleted successfully' });
});

export const getDepartmentStats = asyncHandler(async (req: Request, res: Response) => {
  const [totalDepartments, departmentsWithEmployees] = await Promise.all([
    prisma.department.count(),
    prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            employees: true,
          }
        }
      },
    }),
  ]);

  const totalEmployees = departmentsWithEmployees.reduce(
    (sum, dept) => sum + dept._count.employees, 
    0
  );

  res.json({
    totalDepartments,
    totalEmployees,
    departmentsWithEmployees: departmentsWithEmployees.map(dept => ({
      department: dept.name,
      count: dept._count.employees,
    })),
  });
});
