import { Router } from 'express';
import {
  createPayrollRecord,
  getAllPayrollRecords,
  getPayrollRecordById,
  updatePayrollRecord,
  processPayroll,
  getPayrollStats,
} from '../controllers/payrollController';
import { requireAuth, requireHRorAdmin } from '../middleware/auth';

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

// Payroll routes - HR and Admin only
router.post('/', requireHRorAdmin, createPayrollRecord);
router.get('/', requireHRorAdmin, getAllPayrollRecords);
router.get('/stats', requireHRorAdmin, getPayrollStats);
router.get('/:id', requireHRorAdmin, getPayrollRecordById);
router.put('/:id', requireHRorAdmin, updatePayrollRecord);
router.post('/:id/process', requireHRorAdmin, processPayroll);

export default router;
