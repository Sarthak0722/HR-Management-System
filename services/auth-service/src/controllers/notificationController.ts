import { Request, Response } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: { userId },
    }),
  ]);

  res.json({
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { notificationId } = req.params;

  const notification = await prisma.notification.findFirst({
    where: { 
      id: notificationId,
      userId 
    },
  });

  if (!notification) {
    throw createError(404, 'Notification not found');
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  logger.info('Notification marked as read', {
    userId,
    notificationId,
  });

  res.json({ message: 'Notification marked as read' });
});

export const markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  await prisma.notification.updateMany({
    where: { 
      userId,
      isRead: false 
    },
    data: { isRead: true },
  });

  logger.info('All notifications marked as read', { userId });

  res.json({ message: 'All notifications marked as read' });
});

export const getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const count = await prisma.notification.count({
    where: { 
      userId,
      isRead: false 
    },
  });

  res.json({ unreadCount: count });
});

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, message, type } = req.body;

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type: type as NotificationType,
    },
  });

  logger.info('Notification created', {
    notificationId: notification.id,
    userId,
    type,
  });

  res.status(201).json(notification);
});

export const deleteNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { notificationId } = req.params;

  const notification = await prisma.notification.findFirst({
    where: { 
      id: notificationId,
      userId 
    },
  });

  if (!notification) {
    throw createError(404, 'Notification not found');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  logger.info('Notification deleted', {
    userId,
    notificationId,
  });

  res.json({ message: 'Notification deleted' });
});
