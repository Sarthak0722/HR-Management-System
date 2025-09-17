import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, Word, and Excel files are allowed.'));
    }
  },
});

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  type: z.enum(['CONTRACT', 'ID_PROOF', 'ADDRESS_PROOF', 'EDUCATIONAL_CERTIFICATE', 'EXPERIENCE_CERTIFICATE', 'MEDICAL_CERTIFICATE', 'OTHER']),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const uploadDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = createDocumentSchema.parse(req.body);
  
  if (!req.file) {
    throw createError(400, 'No file uploaded');
  }

  const document = await prisma.document.create({
    data: {
      userId: req.user?.id || '',
      title: validatedData.title,
      type: validatedData.type,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: validatedData.description,
      isPublic: validatedData.isPublic,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: req.user?.id || '',
      title: 'Document Uploaded',
      message: `Document "${validatedData.title}" has been uploaded successfully`,
      type: 'DOCUMENT_UPLOADED',
    },
  });

  logger.info(`Document uploaded: ${document.id}`, { userId: req.user?.id });
  res.status(201).json({ success: true, data: document });
});

export const getAllDocuments = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const userId = req.query.userId as string;
  const type = req.query.type as string;
  const isPublic = req.query.isPublic ? req.query.isPublic === 'true' : undefined;

  const where: any = {};
  if (userId) where.userId = userId;
  if (type) where.type = type;
  if (isPublic !== undefined) where.isPublic = isPublic;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        user: {
          include: {
            employeeProfile: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { uploadedAt: 'desc' },
    }),
    prisma.document.count({ where }),
  ]);

  res.json({
    success: true,
    data: documents,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getDocumentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  if (!document) {
    throw createError(404, 'Document not found');
  }

  res.json({ success: true, data: document });
});

export const downloadDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw createError(404, 'Document not found');
  }

  if (!fs.existsSync(document.filePath)) {
    throw createError(404, 'File not found on server');
  }

  res.download(document.filePath, document.fileName);
});

export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
  }).parse(req.body);

  const existingDocument = await prisma.document.findUnique({
    where: { id },
  });

  if (!existingDocument) {
    throw createError(404, 'Document not found');
  }

  const updatedDocument = await prisma.document.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  logger.info(`Document updated: ${id}`);
  res.json({ success: true, data: updatedDocument });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw createError(404, 'Document not found');
  }

  // Delete file from filesystem
  if (fs.existsSync(document.filePath)) {
    fs.unlinkSync(document.filePath);
  }

  await prisma.document.delete({
    where: { id },
  });

  logger.info(`Document deleted: ${id}`);
  res.json({ success: true, message: 'Document deleted successfully' });
});

export const getDocumentStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await prisma.document.groupBy({
    by: ['type'],
    _count: {
      id: true,
    },
  });

  const totalSize = await prisma.document.aggregate({
    _sum: {
      fileSize: true,
    },
  });

  const totalDocuments = await prisma.document.count();

  res.json({
    success: true,
    data: {
      typeDistribution: stats,
      totalDocuments,
      totalSize: totalSize._sum.fileSize || 0,
    },
  });
});

// Export multer middleware for use in routes
export { upload };
