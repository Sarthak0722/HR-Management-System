import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { UpdateProfileRequest } from '../types';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employeeProfile: true },
  });

  if (!user || !user.employeeProfile) {
    throw createError('Profile not found', 404);
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    employeeProfile: user.employeeProfile,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user!.userId;
  const updateData = updateProfileSchema.parse(req.body);

  // Check if user has a profile
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { employeeProfile: true },
  });

  if (!existingUser || !existingUser.employeeProfile) {
    throw createError('Profile not found', 404);
  }

  // Update profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      employeeProfile: {
        update: updateData,
      },
    },
    include: { employeeProfile: true },
  });

  logger.info('Profile updated by employee', {
    userId,
    updateData,
  });

  res.json({
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    employeeProfile: updatedUser.employeeProfile,
  });
});
