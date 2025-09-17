import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const createLeaveBalanceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  leaveType: z.enum(['SICK_LEAVE', 'VACATION', 'PERSONAL_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE']),
  totalDays: z.number().min(0, 'Total days cannot be negative'),
  year: z.number().min(2020).max(2030, 'Year must be between 2020 and 2030'),
});

const updateLeaveBalanceSchema = z.object({
  totalDays: z.number().min(0, 'Total days cannot be negative').optional(),
});

export const createLeaveBalance = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createLeaveBalanceSchema.parse(req.body);
  
  // Check if leave balance already exists for this user, leave type, and year
  const existingBalance = await prisma.leaveBalance.findUnique({
    where: {
      userId_leaveType_year: {
        userId: validatedData.userId,
        leaveType: validatedData.leaveType,
        year: validatedData.year,
      },
    },
  });

  if (existingBalance) {
    throw createError(400, 'Leave balance already exists for this user, leave type, and year');
  }

  const leaveBalance = await prisma.leaveBalance.create({
    data: {
      ...validatedData,
      remainingDays: validatedData.totalDays,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  logger.info(`Leave balance created for user ${validatedData.userId}`, { balanceId: leaveBalance.id });
  res.status(201).json({ success: true, data: leaveBalance });
});

export const getAllLeaveBalances = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const userId = req.query.userId as string;
  const leaveType = req.query.leaveType as string;
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;

  const where: any = {};
  if (userId) where.userId = userId;
  if (leaveType) where.leaveType = leaveType;
  if (year) where.year = year;

  const [leaveBalances, total] = await Promise.all([
    prisma.leaveBalance.findMany({
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
    prisma.leaveBalance.count({ where }),
  ]);

  res.json({
    success: true,
    data: leaveBalances,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getLeaveBalanceById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const leaveBalance = await prisma.leaveBalance.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  if (!leaveBalance) {
    throw createError(404, 'Leave balance not found');
  }

  res.json({ success: true, data: leaveBalance });
});

export const updateLeaveBalance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateLeaveBalanceSchema.parse(req.body);

  const existingBalance = await prisma.leaveBalance.findUnique({
    where: { id },
  });

  if (!existingBalance) {
    throw createError(404, 'Leave balance not found');
  }

  const newTotalDays = validatedData.totalDays || existingBalance.totalDays;
  const newRemainingDays = newTotalDays - existingBalance.usedDays;

  if (newRemainingDays < 0) {
    throw createError(400, 'Total days cannot be less than used days');
  }

  const updatedBalance = await prisma.leaveBalance.update({
    where: { id },
    data: {
      ...validatedData,
      remainingDays: newRemainingDays,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  logger.info(`Leave balance updated: ${id}`);
  res.json({ success: true, data: updatedBalance });
});

export const getUserLeaveBalances = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const leaveBalances = await prisma.leaveBalance.findMany({
    where: {
      userId,
      year,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
    orderBy: { leaveType: 'asc' },
  });

  res.json({ success: true, data: leaveBalances });
});

export const updateLeaveUsage = asyncHandler(async (req: Request, res: Response) => {
  const { userId, leaveType, year } = req.params;
  const { days } = req.body;

  if (!days || days < 0) {
    throw createError(400, 'Days must be a positive number');
  }

  const leaveBalance = await prisma.leaveBalance.findUnique({
    where: {
      userId_leaveType_year: {
        userId,
        leaveType: leaveType as any,
        year: parseInt(year),
      },
    },
  });

  if (!leaveBalance) {
    throw createError(404, 'Leave balance not found');
  }

  const newUsedDays = leaveBalance.usedDays + days;
  const newRemainingDays = leaveBalance.totalDays - newUsedDays;

  if (newRemainingDays < 0) {
    throw createError(400, 'Insufficient leave balance');
  }

  const updatedBalance = await prisma.leaveBalance.update({
    where: { id: leaveBalance.id },
    data: {
      usedDays: newUsedDays,
      remainingDays: newRemainingDays,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  logger.info(`Leave usage updated for user ${userId}`, { leaveType, days });
  res.json({ success: true, data: updatedBalance });
});

export const resetLeaveBalances = asyncHandler(async (req: Request, res: Response) => {
  const { year } = req.params;
  const yearNum = parseInt(year);

  if (yearNum < 2020 || yearNum > 2030) {
    throw createError(400, 'Invalid year');
  }

  // Reset all leave balances for the year
  const leaveBalances = await prisma.leaveBalance.findMany({
    where: { year: yearNum },
  });

  const result = await prisma.leaveBalance.updateMany({
    where: { year: yearNum },
    data: {
      usedDays: 0,
    },
  });

  // Update remaining days to match total days
  for (const balance of leaveBalances) {
    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        remainingDays: balance.totalDays,
      },
    });
  }

  logger.info(`Leave balances reset for year ${year}`, { count: result.count });
  res.json({ 
    success: true, 
    message: `Reset ${result.count} leave balances for year ${year}`,
    count: result.count 
  });
});

export const getLeaveBalanceStats = asyncHandler(async (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const stats = await prisma.leaveBalance.groupBy({
    by: ['leaveType'],
    where: { year },
    _sum: {
      totalDays: true,
      usedDays: true,
      remainingDays: true,
    },
    _count: {
      id: true,
    },
  });

  const totalStats = await prisma.leaveBalance.aggregate({
    where: { year },
    _sum: {
      totalDays: true,
      usedDays: true,
      remainingDays: true,
    },
    _count: {
      id: true,
    },
  });

  res.json({
    success: true,
    data: {
      leaveTypeBreakdown: stats,
      totalRecords: totalStats._count.id,
      totalDaysAllocated: totalStats._sum.totalDays || 0,
      totalDaysUsed: totalStats._sum.usedDays || 0,
      totalDaysRemaining: totalStats._sum.remainingDays || 0,
    },
  });
});
