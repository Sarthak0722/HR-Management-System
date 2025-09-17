import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { UserRole } from '@prisma/client';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
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

    // Verify token with auth service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    
    try {
      const response = await axios.get(`${authServiceUrl}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `token=${token}`,
        },
      });

      req.user = {
        userId: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role,
      };

      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(403).json({ error: 'Invalid or expired token' });
    }
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

export const requireEmployee = requireRole([UserRole.EMPLOYEE]);
export const requireAnyRole = requireRole([UserRole.HR, UserRole.EMPLOYEE]);
