import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
} from '../controllers/departmentController';

const router: Router = Router();

// Public routes
router.get('/', getAllDepartments);
router.get('/stats', getDepartmentStats);
router.get('/:id', getDepartmentById);

// Protected routes - Admin only
router.post('/', authenticateToken, requireRole(['ADMIN']), createDepartment);
router.put('/:id', authenticateToken, requireRole(['ADMIN']), updateDepartment);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deleteDepartment);

export default router;
