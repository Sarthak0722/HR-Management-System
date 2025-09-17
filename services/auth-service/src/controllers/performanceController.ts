import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const createPerformanceReviewSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reviewerId: z.string().min(1, 'Reviewer ID is required'),
  reviewPeriod: z.string().min(1, 'Review period is required'),
  goals: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    targetDate: z.string(),
    status: z.string().default('NOT_STARTED'),
    progress: z.number().min(0).max(100).default(0),
  })).optional(),
  achievements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    impact: z.string().optional(),
  })).optional(),
  rating: z.enum(['EXCELLENT', 'GOOD', 'SATISFACTORY', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY']),
  feedback: z.string().optional(),
  improvementPlan: z.string().optional(),
  nextReviewDate: z.string().optional(),
});

const updatePerformanceReviewSchema = z.object({
  goals: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    targetDate: z.string(),
    status: z.string().default('NOT_STARTED'),
    progress: z.number().min(0).max(100).default(0),
  })).optional(),
  achievements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    impact: z.string().optional(),
  })).optional(),
  rating: z.enum(['EXCELLENT', 'GOOD', 'SATISFACTORY', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY']).optional(),
  feedback: z.string().optional(),
  improvementPlan: z.string().optional(),
  nextReviewDate: z.string().optional(),
});

const createGoalSchema = z.object({
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  targetDate: z.string().min(1, 'Target date is required'),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const createPerformanceReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = createPerformanceReviewSchema.parse(req.body);
  
  const performanceReview = await prisma.performanceReview.create({
    data: {
      ...validatedData,
      nextReviewDate: validatedData.nextReviewDate ? new Date(validatedData.nextReviewDate) : null,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
      reviewer: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  // Create notification for employee
  await prisma.notification.create({
    data: {
      userId: validatedData.userId,
      title: 'Performance Review Created',
      message: `A performance review has been created for you by ${performanceReview.reviewer.employeeProfile?.firstName} ${performanceReview.reviewer.employeeProfile?.lastName}`,
      type: 'PERFORMANCE_REVIEW',
    },
  });

  logger.info(`Performance review created for user ${validatedData.userId}`, { reviewId: performanceReview.id });
  res.status(201).json({ success: true, data: performanceReview });
});

export const getAllPerformanceReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const userId = req.query.userId as string;
  const reviewerId = req.query.reviewerId as string;

  const where: any = {};
  if (userId) where.userId = userId;
  if (reviewerId) where.reviewerId = reviewerId;

  const [reviews, total] = await Promise.all([
    prisma.performanceReview.findMany({
      where,
      include: {
        user: {
          include: {
            employeeProfile: true,
          },
        },
        reviewer: {
          include: {
            employeeProfile: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.performanceReview.count({ where }),
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getPerformanceReviewById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const review = await prisma.performanceReview.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
      reviewer: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  if (!review) {
    throw createError(404, 'Performance review not found');
  }

  res.json({ success: true, data: review });
});

export const updatePerformanceReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updatePerformanceReviewSchema.parse(req.body);

  const existingReview = await prisma.performanceReview.findUnique({
    where: { id },
  });

  if (!existingReview) {
    throw createError(404, 'Performance review not found');
  }

  const updatedReview = await prisma.performanceReview.update({
    where: { id },
    data: {
      ...validatedData,
      nextReviewDate: validatedData.nextReviewDate ? new Date(validatedData.nextReviewDate) : existingReview.nextReviewDate,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
      reviewer: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  logger.info(`Performance review updated: ${id}`);
  res.json({ success: true, data: updatedReview });
});

export const createGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = createGoalSchema.parse(req.body);
  
  const goal = await prisma.goal.create({
    data: {
      ...validatedData,
      targetDate: new Date(validatedData.targetDate),
      userId: req.user?.id || '',
    },
  });

  logger.info(`Goal created for user ${req.user?.id}`, { goalId: goal.id });
  res.status(201).json({ success: true, data: goal });
});

export const getAllGoals = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const userId = req.query.userId as string;
  const status = req.query.status as string;

  const where: any = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;

  const [goals, total] = await Promise.all([
    prisma.goal.findMany({
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
    prisma.goal.count({ where }),
  ]);

  res.json({
    success: true,
    data: goals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateGoalSchema.parse(req.body);

  const existingGoal = await prisma.goal.findUnique({
    where: { id },
  });

  if (!existingGoal) {
    throw createError(404, 'Goal not found');
  }

  const updatedGoal = await prisma.goal.update({
    where: { id },
    data: {
      ...validatedData,
      targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : existingGoal.targetDate,
    },
  });

  logger.info(`Goal updated: ${id}`);
  res.json({ success: true, data: updatedGoal });
});

export const getPerformanceStats = asyncHandler(async (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const ratingStats = await prisma.performanceReview.groupBy({
    by: ['rating'],
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    _count: {
      id: true,
    },
  });

  const goalStats = await prisma.goal.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const avgProgress = await prisma.goal.aggregate({
    _avg: {
      progress: true,
    },
  });

  res.json({
    success: true,
    data: {
      ratingDistribution: ratingStats,
      goalStatusDistribution: goalStats,
      averageGoalProgress: avgProgress._avg.progress || 0,
    },
  });
});
