import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { JWTPayload } from '../types';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireHR = requireRole([UserRole.HR]);
export const requireEmployee = requireRole([UserRole.EMPLOYEE]);
export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireHRorAdmin = requireRole([UserRole.HR, UserRole.ADMIN]);
export const requireAnyRole = requireRole([UserRole.HR, UserRole.EMPLOYEE, UserRole.ADMIN]);
