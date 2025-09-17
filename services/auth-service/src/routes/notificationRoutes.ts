import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification,
  deleteNotification,
} from '../controllers/notificationController';

const router: Router = Router();

// Protected routes
router.get('/', authenticateToken, getNotifications);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.put('/:notificationId/read', authenticateToken, markAsRead);
router.put('/mark-all-read', authenticateToken, markAllAsRead);
router.delete('/:notificationId', authenticateToken, deleteNotification);

// Admin route for creating notifications
router.post('/', authenticateToken, createNotification);

export default router;
