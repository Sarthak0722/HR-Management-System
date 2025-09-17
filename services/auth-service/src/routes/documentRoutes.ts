import { Router } from 'express';
import {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  downloadDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  upload,
} from '../controllers/documentController';
import { requireAuth, requireHRorAdmin } from '../middleware/auth';

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

// Document routes
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getAllDocuments);
router.get('/stats', requireHRorAdmin, getDocumentStats);
router.get('/:id', getDocumentById);
router.get('/:id/download', downloadDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
