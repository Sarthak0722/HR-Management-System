import { Request, Response } from 'express';
import { PrismaClient, LeaveType } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateLeaveRequest } from '../types';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const createLeaveSchema = z.object({
  type: z.nativeEnum(LeaveType),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
});

export const getMyLeaves = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leave.count({
      where: { userId },
    }),
  ]);

  res.json({
    leaves,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getLeaveById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as AuthenticatedRequest).user!.userId;

  const leave = await prisma.leave.findFirst({
    where: { id, userId },
  });

  if (!leave) {
    throw createError('Leave request not found', 404);
  }

  res.json(leave);
});

export const createLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user!.userId;
  const { type, startDate, endDate, reason } = createLeaveSchema.parse(req.body);

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    throw createError('End date must be after start date', 400);
  }

  if (start < new Date()) {
    throw createError('Start date cannot be in the past', 400);
  }

  // Check for overlapping leave requests
  const overlappingLeave = await prisma.leave.findFirst({
    where: {
      userId,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        {
          AND: [
            { startDate: { lte: start } },
            { endDate: { gte: start } },
          ],
        },
        {
          AND: [
            { startDate: { lte: end } },
            { endDate: { gte: end } },
          ],
        },
        {
          AND: [
            { startDate: { gte: start } },
            { endDate: { lte: end } },
          ],
        },
      ],
    },
  });

  if (overlappingLeave) {
    throw createError('You already have a leave request for this period', 400);
  }

  const leave = await prisma.leave.create({
    data: {
      userId,
      type,
      startDate: start,
      endDate: end,
      reason,
    },
  });

  logger.info('Leave request created by employee', {
    userId,
    leaveId: leave.id,
    type,
    startDate: start,
    endDate: end,
  });

  res.status(201).json(leave);
});

export const updateLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as AuthenticatedRequest).user!.userId;
  const { type, startDate, endDate, reason } = createLeaveSchema.parse(req.body);

  // Check if leave exists and belongs to user
  const existingLeave = await prisma.leave.findFirst({
    where: { id, userId },
  });

  if (!existingLeave) {
    throw createError('Leave request not found', 404);
  }

  if (existingLeave.status !== 'PENDING') {
    throw createError('Cannot update leave request that has been processed', 400);
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    throw createError('End date must be after start date', 400);
  }

  if (start < new Date()) {
    throw createError('Start date cannot be in the past', 400);
  }

  // Check for overlapping leave requests (excluding current one)
  const overlappingLeave = await prisma.leave.findFirst({
    where: {
      userId,
      id: { not: id },
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        {
          AND: [
            { startDate: { lte: start } },
            { endDate: { gte: start } },
          ],
        },
        {
          AND: [
            { startDate: { lte: end } },
            { endDate: { gte: end } },
          ],
        },
        {
          AND: [
            { startDate: { gte: start } },
            { endDate: { lte: end } },
          ],
        },
      ],
    },
  });

  if (overlappingLeave) {
    throw createError('You already have a leave request for this period', 400);
  }

  const updatedLeave = await prisma.leave.update({
    where: { id },
    data: {
      type,
      startDate: start,
      endDate: end,
      reason,
    },
  });

  logger.info('Leave request updated by employee', {
    userId,
    leaveId: id,
    type,
    startDate: start,
    endDate: end,
  });

  res.json(updatedLeave);
});

export const cancelLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as AuthenticatedRequest).user!.userId;

  // Check if leave exists and belongs to user
  const existingLeave = await prisma.leave.findFirst({
    where: { id, userId },
  });

  if (!existingLeave) {
    throw createError('Leave request not found', 404);
  }

  if (existingLeave.status !== 'PENDING') {
    throw createError('Cannot cancel leave request that has been processed', 400);
  }

  await prisma.leave.delete({
    where: { id },
  });

  logger.info('Leave request cancelled by employee', {
    userId,
    leaveId: id,
  });

  res.json({ message: 'Leave request cancelled successfully' });
});

export const getLeaveStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user!.userId;

  const [
    totalLeaves,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
    leavesByType,
  ] = await Promise.all([
    prisma.leave.count({ where: { userId } }),
    prisma.leave.count({ where: { userId, status: 'PENDING' } }),
    prisma.leave.count({ where: { userId, status: 'APPROVED' } }),
    prisma.leave.count({ where: { userId, status: 'REJECTED' } }),
    prisma.leave.groupBy({
      by: ['type'],
      _count: { type: true },
      where: { userId },
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
