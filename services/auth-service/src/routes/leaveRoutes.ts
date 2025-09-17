import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus,
  getLeaveStats,
  deleteLeaveRequest,
} from '../controllers/leaveController';

const router: Router = Router();

// Employee routes
router.post('/', authenticateToken, createLeaveRequest);
router.get('/my', authenticateToken, getMyLeaveRequests);
router.get('/stats', authenticateToken, getLeaveStats);
router.delete('/:id', authenticateToken, deleteLeaveRequest);

// HR/Admin routes
router.get('/', authenticateToken, requireRole(['HR', 'ADMIN']), getAllLeaveRequests);
router.put('/:id/status', authenticateToken, requireRole(['HR', 'ADMIN']), updateLeaveStatus);

export default router;
