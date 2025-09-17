import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const createTrainingProgramSchema = z.object({
  title: z.string().min(1, 'Training program title is required'),
  description: z.string().optional(),
  duration: z.number().positive('Duration must be positive'),
  cost: z.number().min(0, 'Cost cannot be negative').optional(),
});

const updateTrainingProgramSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  duration: z.number().positive().optional(),
  cost: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const enrollInTrainingSchema = z.object({
  trainingProgramId: z.string().min(1, 'Training program ID is required'),
});

const updateEnrollmentSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
  score: z.number().min(0).max(100).optional(),
  certificate: z.string().optional(),
});

export const createTrainingProgram = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createTrainingProgramSchema.parse(req.body);
  
  const trainingProgram = await prisma.trainingProgram.create({
    data: validatedData,
  });

  logger.info(`Training program created: ${trainingProgram.id}`);
  res.status(201).json({ success: true, data: trainingProgram });
});

export const getAllTrainingPrograms = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

  const where: any = {};
  if (isActive !== undefined) where.isActive = isActive;

  const [programs, total] = await Promise.all([
    prisma.trainingProgram.findMany({
      where,
      include: {
        enrollments: {
          include: {
            user: {
              include: {
                employeeProfile: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trainingProgram.count({ where }),
  ]);

  res.json({
    success: true,
    data: programs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getTrainingProgramById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const program = await prisma.trainingProgram.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: {
          user: {
            include: {
              employeeProfile: true,
            },
          },
        },
      },
    },
  });

  if (!program) {
    throw createError(404, 'Training program not found');
  }

  res.json({ success: true, data: program });
});

export const updateTrainingProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTrainingProgramSchema.parse(req.body);

  const existingProgram = await prisma.trainingProgram.findUnique({
    where: { id },
  });

  if (!existingProgram) {
    throw createError(404, 'Training program not found');
  }

  const updatedProgram = await prisma.trainingProgram.update({
    where: { id },
    data: validatedData,
  });

  logger.info(`Training program updated: ${id}`);
  res.json({ success: true, data: updatedProgram });
});

export const deleteTrainingProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingProgram = await prisma.trainingProgram.findUnique({
    where: { id },
    include: {
      enrollments: true,
    },
  });

  if (!existingProgram) {
    throw createError(404, 'Training program not found');
  }

  if (existingProgram.enrollments.length > 0) {
    throw createError(400, 'Cannot delete training program with existing enrollments');
  }

  await prisma.trainingProgram.delete({
    where: { id },
  });

  logger.info(`Training program deleted: ${id}`);
  res.json({ success: true, message: 'Training program deleted successfully' });
});

export const enrollInTraining = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = enrollInTrainingSchema.parse(req.body);
  
  // Check if user is already enrolled
  const existingEnrollment = await prisma.trainingEnrollment.findUnique({
    where: {
      userId_trainingProgramId: {
        userId: req.user?.id || '',
        trainingProgramId: validatedData.trainingProgramId,
      },
    },
  });

  if (existingEnrollment) {
    throw createError(400, 'User is already enrolled in this training program');
  }

  // Check if training program exists and is active
  const trainingProgram = await prisma.trainingProgram.findUnique({
    where: { id: validatedData.trainingProgramId },
  });

  if (!trainingProgram) {
    throw createError(404, 'Training program not found');
  }

  if (!trainingProgram.isActive) {
    throw createError(400, 'Training program is not active');
  }

  const enrollment = await prisma.trainingEnrollment.create({
    data: {
      userId: req.user?.id || '',
      trainingProgramId: validatedData.trainingProgramId,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
      trainingProgram: true,
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: req.user?.id || '',
      title: 'Training Enrolled',
      message: `You have been enrolled in the training program: ${trainingProgram.title}`,
      type: 'TRAINING_ASSIGNED',
    },
  });

  logger.info(`User enrolled in training program: ${validatedData.trainingProgramId}`, { enrollmentId: enrollment.id });
  res.status(201).json({ success: true, data: enrollment });
});

export const getAllEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const userId = req.query.userId as string;
  const status = req.query.status as string;

  const where: any = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;

  const [enrollments, total] = await Promise.all([
    prisma.trainingEnrollment.findMany({
      where,
      include: {
        user: {
          include: {
            employeeProfile: true,
          },
        },
        trainingProgram: true,
      },
      skip,
      take: limit,
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.trainingEnrollment.count({ where }),
  ]);

  res.json({
    success: true,
    data: enrollments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateEnrollmentSchema.parse(req.body);

  const existingEnrollment = await prisma.trainingEnrollment.findUnique({
    where: { id },
  });

  if (!existingEnrollment) {
    throw createError(404, 'Enrollment not found');
  }

  const updateData: any = { ...validatedData };
  
  // If status is being updated to COMPLETED, set completedAt
  if (validatedData.status === 'COMPLETED' && existingEnrollment.status !== 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  const updatedEnrollment = await prisma.trainingEnrollment.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
      trainingProgram: true,
    },
  });

  logger.info(`Training enrollment updated: ${id}`);
  res.json({ success: true, data: updatedEnrollment });
});

export const getTrainingStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await prisma.trainingEnrollment.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const avgScore = await prisma.trainingEnrollment.aggregate({
    where: {
      score: {
        not: null,
      },
    },
    _avg: {
      score: true,
    },
  });

  const completionRate = await prisma.trainingEnrollment.count({
    where: {
      status: 'COMPLETED',
    },
  });

  const totalEnrollments = await prisma.trainingEnrollment.count();

  res.json({
    success: true,
    data: {
      statusDistribution: stats,
      averageScore: avgScore._avg.score || 0,
      completionRate: totalEnrollments > 0 ? (completionRate / totalEnrollments) * 100 : 0,
      totalEnrollments,
      completedEnrollments: completionRate,
    },
  });
});
