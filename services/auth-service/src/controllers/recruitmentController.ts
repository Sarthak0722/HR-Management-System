import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const createJobPostingSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  departmentId: z.string().min(1, 'Department ID is required'),
  positionId: z.string().optional(),
  description: z.string().min(1, 'Job description is required'),
  requirements: z.string().min(1, 'Requirements are required'),
  responsibilities: z.string().min(1, 'Responsibilities are required'),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  location: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).default('FULL_TIME'),
});

const updateJobPostingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  requirements: z.string().min(1).optional(),
  responsibilities: z.string().min(1).optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  location: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED']).optional(),
});

const createJobApplicationSchema = z.object({
  jobPostingId: z.string().min(1, 'Job posting ID is required'),
  candidateName: z.string().min(1, 'Candidate name is required'),
  candidateEmail: z.string().email('Valid email is required'),
  candidatePhone: z.string().optional(),
  resume: z.string().optional(),
  coverLetter: z.string().optional(),
});

const updateJobApplicationSchema = z.object({
  status: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'SELECTED', 'REJECTED', 'WITHDRAWN']).optional(),
  notes: z.string().optional(),
});

export const createJobPosting = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createJobPostingSchema.parse(req.body);
  
  // Validate salary range
  if (validatedData.salaryMin && validatedData.salaryMax && validatedData.salaryMin > validatedData.salaryMax) {
    throw createError(400, 'Minimum salary cannot be greater than maximum salary');
  }

  const jobPosting = await prisma.jobPosting.create({
    data: validatedData,
    include: {
      department: true,
      position: true,
      applications: {
        include: {
          user: {
            include: {
              employeeProfile: true,
            },
          },
        },
      },
    },
  });

  logger.info(`Job posting created: ${jobPosting.id}`);
  res.status(201).json({ success: true, data: jobPosting });
});

export const getAllJobPostings = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status as string;
  const departmentId = req.query.departmentId as string;
  const employmentType = req.query.employmentType as string;

  const where: any = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (employmentType) where.employmentType = employmentType;

  const [jobPostings, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      include: {
        department: true,
        position: true,
        applications: {
          include: {
            user: {
              include: {
                employeeProfile: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.jobPosting.count({ where }),
  ]);

  res.json({
    success: true,
    data: jobPostings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getJobPostingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const jobPosting = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      department: true,
      position: true,
      applications: {
        include: {
          user: {
            include: {
              employeeProfile: true,
            },
          },
        },
      },
    },
  });

  if (!jobPosting) {
    throw createError(404, 'Job posting not found');
  }

  res.json({ success: true, data: jobPosting });
});

export const updateJobPosting = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateJobPostingSchema.parse(req.body);

  const existingPosting = await prisma.jobPosting.findUnique({
    where: { id },
  });

  if (!existingPosting) {
    throw createError(404, 'Job posting not found');
  }

  // Validate salary range
  const salaryMin = validatedData.salaryMin || existingPosting.salaryMin;
  const salaryMax = validatedData.salaryMax || existingPosting.salaryMax;
  
  if (salaryMin && salaryMax && salaryMin > salaryMax) {
    throw createError(400, 'Minimum salary cannot be greater than maximum salary');
  }

  const updatedPosting = await prisma.jobPosting.update({
    where: { id },
    data: {
      ...validatedData,
      postedAt: validatedData.status === 'PUBLISHED' && existingPosting.status !== 'PUBLISHED' ? new Date() : existingPosting.postedAt,
      closedAt: validatedData.status === 'CLOSED' && existingPosting.status !== 'CLOSED' ? new Date() : existingPosting.closedAt,
    },
    include: {
      department: true,
      position: true,
      applications: {
        include: {
          user: {
            include: {
              employeeProfile: true,
            },
          },
        },
      },
    },
  });

  logger.info(`Job posting updated: ${id}`);
  res.json({ success: true, data: updatedPosting });
});

export const deleteJobPosting = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingPosting = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      applications: true,
    },
  });

  if (!existingPosting) {
    throw createError(404, 'Job posting not found');
  }

  if (existingPosting.applications.length > 0) {
    throw createError(400, 'Cannot delete job posting with existing applications');
  }

  await prisma.jobPosting.delete({
    where: { id },
  });

  logger.info(`Job posting deleted: ${id}`);
  res.json({ success: true, message: 'Job posting deleted successfully' });
});

export const createJobApplication = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createJobApplicationSchema.parse(req.body);
  
  // Check if job posting exists and is published
  const jobPosting = await prisma.jobPosting.findUnique({
    where: { id: validatedData.jobPostingId },
  });

  if (!jobPosting) {
    throw createError(404, 'Job posting not found');
  }

  if (jobPosting.status !== 'PUBLISHED') {
    throw createError(400, 'Job posting is not currently accepting applications');
  }

  // Check if candidate already applied
  const existingApplication = await prisma.jobApplication.findFirst({
    where: {
      jobPostingId: validatedData.jobPostingId,
      candidateEmail: validatedData.candidateEmail,
    },
  });

  if (existingApplication) {
    throw createError(400, 'Candidate has already applied for this position');
  }

  const application = await prisma.jobApplication.create({
    data: validatedData,
    include: {
      jobPosting: {
        include: {
          department: true,
          position: true,
        },
      },
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  logger.info(`Job application created: ${application.id}`);
  res.status(201).json({ success: true, data: application });
});

export const getAllJobApplications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const jobPostingId = req.query.jobPostingId as string;
  const status = req.query.status as string;

  const where: any = {};
  if (jobPostingId) where.jobPostingId = jobPostingId;
  if (status) where.status = status;

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      include: {
        jobPosting: {
          include: {
            department: true,
            position: true,
          },
        },
        user: {
          include: {
            employeeProfile: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { appliedAt: 'desc' },
    }),
    prisma.jobApplication.count({ where }),
  ]);

  res.json({
    success: true,
    data: applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const updateJobApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateJobApplicationSchema.parse(req.body);

  const existingApplication = await prisma.jobApplication.findUnique({
    where: { id },
  });

  if (!existingApplication) {
    throw createError(404, 'Job application not found');
  }

  const updateData: any = { ...validatedData };
  
  // Set reviewedAt when status changes from APPLIED
  if (validatedData.status && validatedData.status !== 'APPLIED' && existingApplication.status === 'APPLIED') {
    updateData.reviewedAt = new Date();
  }

  // Set interviewedAt when status changes to INTERVIEWED
  if (validatedData.status === 'INTERVIEWED' && existingApplication.status !== 'INTERVIEWED') {
    updateData.interviewedAt = new Date();
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id },
    data: updateData,
    include: {
      jobPosting: {
        include: {
          department: true,
          position: true,
        },
      },
      user: {
        include: {
          employeeProfile: true,
        },
      },
    },
  });

  logger.info(`Job application updated: ${id}`);
  res.json({ success: true, data: updatedApplication });
});

export const getRecruitmentStats = asyncHandler(async (req: Request, res: Response) => {
  const jobPostingStats = await prisma.jobPosting.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const applicationStats = await prisma.jobApplication.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const totalApplications = await prisma.jobApplication.count();
  const selectedApplications = await prisma.jobApplication.count({
    where: { status: 'SELECTED' },
  });

  const conversionRate = totalApplications > 0 ? (selectedApplications / totalApplications) * 100 : 0;

  res.json({
    success: true,
    data: {
      jobPostingStatusDistribution: jobPostingStats,
      applicationStatusDistribution: applicationStats,
      totalApplications,
      selectedApplications,
      conversionRate,
    },
  });
});
