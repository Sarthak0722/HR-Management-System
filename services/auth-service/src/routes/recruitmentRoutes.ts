import { Router } from 'express';
import {
  createJobPosting,
  getAllJobPostings,
  getJobPostingById,
  updateJobPosting,
  deleteJobPosting,
  createJobApplication,
  getAllJobApplications,
  updateJobApplication,
  getRecruitmentStats,
} from '../controllers/recruitmentController';
import { requireAuth, requireHRorAdmin } from '../middleware/auth';

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

// Job posting routes - HR and Admin only
router.post('/jobs', requireHRorAdmin, createJobPosting);
router.get('/jobs', getAllJobPostings);
router.get('/jobs/:id', getJobPostingById);
router.put('/jobs/:id', requireHRorAdmin, updateJobPosting);
router.delete('/jobs/:id', requireHRorAdmin, deleteJobPosting);

// Job application routes
router.post('/applications', createJobApplication);
router.get('/applications', getAllJobApplications);
router.put('/applications/:id', requireHRorAdmin, updateJobApplication);

// Stats route - HR and Admin only
router.get('/stats', requireHRorAdmin, getRecruitmentStats);

export default router;
