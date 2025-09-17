import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const createPayrollSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  month: z.number().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2020).max(2030, 'Year must be between 2020 and 2030'),
  basicSalary: z.number().positive('Basic salary must be positive'),
  allowances: z.number().min(0, 'Allowances cannot be negative').default(0),
  deductions: z.number().min(0, 'Deductions cannot be negative').default(0),
  overtimePay: z.number().min(0, 'Overtime pay cannot be negative').default(0),
  bonus: z.number().min(0, 'Bonus cannot be negative').default(0),
});

const updatePayrollSchema = z.object({
  basicSalary: z.number().positive().optional(),
  allowances: z.number().min(0).optional(),
  deductions: z.number().min(0).optional(),
  overtimePay: z.number().min(0).optional(),
  bonus: z.number().min(0).optional(),
});

export const createPayrollRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = createPayrollSchema.parse(req.body);
  
  // Check if payroll record already exists for this user, month, and year
  const existingRecord = await prisma.payrollRecord.findUnique({
    where: {
      userId_month_year: {
        userId: validatedData.userId,
        month: validatedData.month,
        year: validatedData.year,
      },
    },
  });

  if (existingRecord) {
    throw createError(400, 'Payroll record already exists for this user, month, and year');
  }

  // Calculate net salary
  const netSalary = validatedData.basicSalary + validatedData.allowances + validatedData.overtimePay + validatedData.bonus - validatedData.deductions;

  const payrollRecord = await prisma.payrollRecord.create({
    data: {
      ...validatedData,
      netSalary,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  logger.info(`Payroll record created for user ${validatedData.userId}`, { payrollId: payrollRecord.id });
  res.status(201).json({ success: true, data: payrollRecord });
});

export const getAllPayrollRecords = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page)) || 1;
  const limit = parseInt(String(req.query.limit)) || 10;
  const skip = (page - 1) * limit;
  const month = req.query.month ? parseInt(String(req.query.month)) : undefined;
  const year = req.query.year ? parseInt(String(req.query.year)) : undefined;

  const where: any = {};
  if (month) where.month = month;
  if (year) where.year = year;

  const [payrollRecords, total] = await Promise.all([
    prisma.payrollRecord.findMany({
      where,
      include: {
        user: {
          include: {
            employeeProfile: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payrollRecord.count({ where }),
  ]);

  res.json({
    success: true,
    data: payrollRecords,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getPayrollRecordById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payrollRecord = await prisma.payrollRecord.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  if (!payrollRecord) {
    throw createError(404, 'Payroll record not found');
  }

  res.json({ success: true, data: payrollRecord });
});

export const updatePayrollRecord = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updatePayrollSchema.parse(req.body);

  const existingRecord = await prisma.payrollRecord.findUnique({
    where: { id },
  });

  if (!existingRecord) {
    throw createError(404, 'Payroll record not found');
  }

  if (existingRecord.status !== 'DRAFT') {
    throw createError(400, 'Cannot update processed payroll record');
  }

  // Calculate new net salary
  const basicSalary = validatedData.basicSalary || existingRecord.basicSalary;
  const allowances = validatedData.allowances || existingRecord.allowances;
  const deductions = validatedData.deductions || existingRecord.deductions;
  const overtimePay = validatedData.overtimePay || existingRecord.overtimePay;
  const bonus = validatedData.bonus || existingRecord.bonus;
  
  const netSalary = basicSalary + allowances + overtimePay + bonus - deductions;

  const updatedRecord = await prisma.payrollRecord.update({
    where: { id },
    data: {
      ...validatedData,
      netSalary,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  logger.info(`Payroll record updated: ${id}`);
  res.json({ success: true, data: updatedRecord });
});

export const processPayroll = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payrollRecord = await prisma.payrollRecord.findUnique({
    where: { id },
  });

  if (!payrollRecord) {
    throw createError(404, 'Payroll record not found');
  }

  if (payrollRecord.status !== 'DRAFT') {
    throw createError(400, 'Payroll record is already processed');
  }

  const updatedRecord = await prisma.payrollRecord.update({
    where: { id },
    data: {
      status: 'PROCESSED',
      processedAt: new Date(),
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  // Create notification for employee
  await prisma.notification.create({
    data: {
      userId: payrollRecord.userId,
      title: 'Payroll Processed',
      message: `Your payroll for ${payrollRecord.month}/${payrollRecord.year} has been processed. Net salary: $${payrollRecord.netSalary}`,
      type: 'PAYROLL_PROCESSED',
    },
  });

  logger.info(`Payroll record processed: ${id}`);
  res.json({ success: true, data: updatedRecord });
});

export const getPayrollStats = asyncHandler(async (req: Request, res: Response) => {
  const year = parseInt(String(req.query.year)) || new Date().getFullYear();

  const stats = await prisma.payrollRecord.aggregate({
    where: { year },
    _sum: {
      basicSalary: true,
      allowances: true,
      deductions: true,
      overtimePay: true,
      bonus: true,
      netSalary: true,
    },
    _count: {
      id: true,
    },
  });

  const monthlyStats = await prisma.payrollRecord.groupBy({
    by: ['month'],
    where: { year },
    _sum: {
      netSalary: true,
    },
    _count: {
      id: true,
    },
  });

  res.json({
    success: true,
    data: {
      totalRecords: stats._count.id,
      totalBasicSalary: stats._sum.basicSalary || 0,
      totalAllowances: stats._sum.allowances || 0,
      totalDeductions: stats._sum.deductions || 0,
      totalOvertimePay: stats._sum.overtimePay || 0,
      totalBonus: stats._sum.bonus || 0,
      totalNetSalary: stats._sum.netSalary || 0,
      monthlyBreakdown: monthlyStats,
    },
  });
});
