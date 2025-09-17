import { Request, Response } from 'express';
import { PrismaClient, LeaveStatus, LeaveType } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const createLeaveRequestSchema = z.object({
  type: z.nativeEnum(LeaveType),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  reason: z.string().optional(),
});

const updateLeaveStatusSchema = z.object({
  status: z.nativeEnum(LeaveStatus),
  reason: z.string().optional(),
});

export const createLeaveRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const data = createLeaveRequestSchema.parse(req.body);

  // Validate dates
  if (data.startDate >= data.endDate) {
    throw createError(400, 'End date must be after start date');
  }

  if (data.startDate < new Date()) {
    throw createError(400, 'Cannot create leave request for past dates');
  }

  // Check for overlapping leave requests
  const overlappingLeave = await prisma.leave.findFirst({
    where: {
      userId,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        {
          startDate: { lte: data.endDate },
          endDate: { gte: data.startDate },
        },
      ],
    },
  });

  if (overlappingLeave) {
    throw createError(400, 'You already have a leave request for this period');
  }

  const leaveRequest = await prisma.leave.create({
    data: {
      userId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          employeeProfile: {
            select: {
              firstName: true,
              lastName: true,
              department: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      }
    },
  });

  logger.info('Leave request created', {
    leaveId: leaveRequest.id,
    userId,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
  });

  res.status(201).json(leaveRequest);
});

export const getMyLeaveRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status as LeaveStatus | undefined;

  const where: any = { userId };
  if (status) {
    where.status = status;
  }

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leave.count({ where }),
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

export const getAllLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status as LeaveStatus | undefined;

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            employeeProfile: {
              select: {
                firstName: true,
                lastName: true,
                department: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leave.count({ where }),
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

export const updateLeaveStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = updateLeaveStatusSchema.parse(req.body);
  const approvedBy = req.user!.userId;

  const leaveRequest = await prisma.leave.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          employeeProfile: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      }
    },
  });

  if (!leaveRequest) {
    throw createError(404, 'Leave request not found');
  }

  if (leaveRequest.status !== 'PENDING') {
    throw createError(400, 'Leave request has already been processed');
  }

  const updatedLeave = await prisma.leave.update({
    where: { id },
    data: {
      status: data.status,
      approvedBy,
      approvedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          employeeProfile: {
            select: {
              firstName: true,
              lastName: true,
              department: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      }
    },
  });

  logger.info('Leave request status updated', {
    leaveId: id,
    status: data.status,
    approvedBy,
    employeeEmail: leaveRequest.user.email,
  });

  res.json(updatedLeave);
});

export const getLeaveStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;

  const where: any = {};
  if (userId) {
    where.userId = userId;
  }

  const [
    totalLeaves,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
  ] = await Promise.all([
    prisma.leave.count({ where }),
    prisma.leave.count({ where: { ...where, status: 'PENDING' } }),
    prisma.leave.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.leave.count({ where: { ...where, status: 'REJECTED' } }),
  ]);

  res.json({
    totalLeaves,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
  });
});

export const deleteLeaveRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const leaveRequest = await prisma.leave.findFirst({
    where: { 
      id,
      userId 
    },
  });

  if (!leaveRequest) {
    throw createError(404, 'Leave request not found');
  }

  if (leaveRequest.status !== 'PENDING') {
    throw createError(400, 'Cannot delete processed leave request');
  }

  await prisma.leave.delete({
    where: { id },
  });

  logger.info('Leave request deleted', {
    leaveId: id,
    userId,
  });

  res.json({ message: 'Leave request deleted successfully' });
});
