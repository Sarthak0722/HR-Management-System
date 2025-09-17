import { Router } from 'express';
import {
  createLeaveBalance,
  getAllLeaveBalances,
  getLeaveBalanceById,
  updateLeaveBalance,
  getUserLeaveBalances,
  updateLeaveUsage,
  resetLeaveBalances,
  getLeaveBalanceStats,
} from '../controllers/leaveBalanceController';
import { requireAuth, requireHRorAdmin } from '../middleware/auth';

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

// Leave balance routes
router.post('/', requireHRorAdmin, createLeaveBalance);
router.get('/', getAllLeaveBalances);
router.get('/stats', requireHRorAdmin, getLeaveBalanceStats);
router.get('/user/:userId', getUserLeaveBalances);
router.get('/:id', getLeaveBalanceById);
router.put('/:id', requireHRorAdmin, updateLeaveBalance);
router.put('/usage/:userId/:leaveType/:year', requireHRorAdmin, updateLeaveUsage);
router.post('/reset/:year', requireHRorAdmin, resetLeaveBalances);

export default router;
