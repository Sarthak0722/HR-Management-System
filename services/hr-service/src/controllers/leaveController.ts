import { Request, Response } from 'express';
import { PrismaClient, LeaveStatus } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const approveLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const getAllLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status as LeaveStatus | undefined;

  const whereClause = status ? { status } : {};

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            employeeProfile: {
              select: {
                firstName: true,
                lastName: true,
                department: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leave.count({
      where: whereClause,
    }),
  ]);

  res.json({
    leaves: leaves.map(leave => ({
      id: leave.id,
      userId: leave.userId,
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status,
      approvedBy: leave.approvedBy,
      approvedAt: leave.approvedAt,
      createdAt: leave.createdAt,
      user: {
        id: leave.user.id,
        email: leave.user.email,
        employeeProfile: leave.user.employeeProfile,
      },
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getLeaveRequestById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const leave = await prisma.leave.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          employeeProfile: {
            select: {
              firstName: true,
              lastName: true,
              department: true,
            },
          },
        },
      },
    },
  });

  if (!leave) {
    throw createError('Leave request not found', 404);
  }

  res.json({
    id: leave.id,
    userId: leave.userId,
    type: leave.type,
    startDate: leave.startDate,
    endDate: leave.endDate,
    reason: leave.reason,
    status: leave.status,
    approvedBy: leave.approvedBy,
    approvedAt: leave.approvedAt,
    createdAt: leave.createdAt,
    user: {
      id: leave.user.id,
      email: leave.user.email,
      employeeProfile: leave.user.employeeProfile,
    },
  });
});

export const approveLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = approveLeaveSchema.parse(req.body);
  const hrUserId = (req as AuthenticatedRequest).user!.userId;

  const leave = await prisma.leave.findUnique({
    where: { id },
  });

  if (!leave) {
    throw createError('Leave request not found', 404);
  }

  if (leave.status !== 'PENDING') {
    throw createError('Leave request has already been processed', 400);
  }

  const updatedLeave = await prisma.leave.update({
    where: { id },
    data: {
      status,
      approvedBy: hrUserId,
      approvedAt: new Date(),
    },
    include: {
      user: {
        include: {
          employeeProfile: {
            select: {
              firstName: true,
              lastName: true,
              department: true,
            },
          },
        },
      },
    },
  });

  logger.info('Leave request processed by HR', {
    hrUserId,
    leaveId: id,
    status,
    employeeId: leave.userId,
  });

  res.json({
    id: updatedLeave.id,
    userId: updatedLeave.userId,
    type: updatedLeave.type,
    startDate: updatedLeave.startDate,
    endDate: updatedLeave.endDate,
    reason: updatedLeave.reason,
    status: updatedLeave.status,
    approvedBy: updatedLeave.approvedBy,
    approvedAt: updatedLeave.approvedAt,
    user: {
      id: updatedLeave.user.id,
      email: updatedLeave.user.email,
      employeeProfile: updatedLeave.user.employeeProfile,
    },
  });
});

export const getLeaveStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalLeaves,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
    leavesByType,
  ] = await Promise.all([
    prisma.leave.count(),
    prisma.leave.count({ where: { status: 'PENDING' } }),
    prisma.leave.count({ where: { status: 'APPROVED' } }),
    prisma.leave.count({ where: { status: 'REJECTED' } }),
    prisma.leave.groupBy({
      by: ['type'],
      _count: { type: true },
    }),
  ]);

  res.json({
    totalLeaves,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
    leavesByType: leavesByType.map(type => ({
      type: type.type,
      count: type._count.type,
    })),
  });
});
