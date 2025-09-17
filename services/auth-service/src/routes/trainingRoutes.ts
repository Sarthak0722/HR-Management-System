import { Router } from 'express';
import {
  createTrainingProgram,
  getAllTrainingPrograms,
  getTrainingProgramById,
  updateTrainingProgram,
  deleteTrainingProgram,
  enrollInTraining,
  getAllEnrollments,
  updateEnrollment,
  getTrainingStats,
} from '../controllers/trainingController';
import { requireAuth, requireHRorAdmin } from '../middleware/auth';

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

// Training program routes - HR and Admin only
router.post('/programs', requireHRorAdmin, createTrainingProgram);
router.get('/programs', getAllTrainingPrograms);
router.get('/programs/:id', getTrainingProgramById);
router.put('/programs/:id', requireHRorAdmin, updateTrainingProgram);
router.delete('/programs/:id', requireHRorAdmin, deleteTrainingProgram);

// Enrollment routes
router.post('/enroll', enrollInTraining);
router.get('/enrollments', getAllEnrollments);
router.put('/enrollments/:id', updateEnrollment);

// Stats route - HR and Admin only
router.get('/stats', requireHRorAdmin, getTrainingStats);

export default router;
