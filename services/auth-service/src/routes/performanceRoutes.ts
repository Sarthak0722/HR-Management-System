import { Router } from 'express';
import {
  createPerformanceReview,
  getAllPerformanceReviews,
  getPerformanceReviewById,
  updatePerformanceReview,
  createGoal,
  getAllGoals,
  updateGoal,
  getPerformanceStats,
} from '../controllers/performanceController';
import { requireAuth, requireHRorAdmin } from '../middleware/auth';

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

// Performance review routes - HR and Admin only
router.post('/reviews', requireHRorAdmin, createPerformanceReview);
router.get('/reviews', requireHRorAdmin, getAllPerformanceReviews);
router.get('/reviews/:id', requireHRorAdmin, getPerformanceReviewById);
router.put('/reviews/:id', requireHRorAdmin, updatePerformanceReview);

// Goal routes - accessible to all authenticated users
router.post('/goals', createGoal);
router.get('/goals', getAllGoals);
router.put('/goals/:id', updateGoal);

// Stats route - HR and Admin only
router.get('/stats', requireHRorAdmin, getPerformanceStats);

export default router;
