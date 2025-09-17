import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { QARequest, QAResponse } from '../types';
import embeddingService from '../services/embeddingService';
import groqService from '../services/groqService';
import logger from '../utils/logger';

const qaSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  maxResults: z.number().min(1).max(10).optional().default(3),
});

export const askQuestion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { question, maxResults } = qaSchema.parse(req.body);

  try {
    // Find similar policies using embeddings
    const similarPolicies = await embeddingService.findSimilarPolicies(question, maxResults);
    
    if (similarPolicies.length === 0) {
      // If no similar policies found, try to provide a general response
      const generalAnswer = `I couldn't find specific HR policies related to your question: "${question}". 

Here are some general HR topics I can help with:
- Leave policies and time off
- Work hours and attendance
- Dress code and appearance
- Performance reviews
- Employee benefits
- Code of conduct
- Remote work policies
- Expense reimbursement
- IT security
- Training and development

Please contact HR directly for more specific information.`;
      
      res.json({
        answer: generalAnswer,
        sources: [],
        confidence: 0.1,
      });
      return;
    }

    // Generate answer using Groq LLM
    const response: QAResponse = await groqService.generateAnswer(
      question,
      similarPolicies.map(p => p.metadata)
    );

    logger.info('Q&A request processed', {
      question: question.substring(0, 100),
      sourcesFound: similarPolicies.length,
      confidence: response.confidence,
    });

    res.json(response);
  } catch (error) {
    logger.error('Error processing Q&A request:', error);
    throw createError('Failed to process question', 500);
  }
});

export const getHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const embeddingCount = embeddingService.getEmbeddingCount();
  const groqConnected = await groqService.testConnection();

  res.json({
    status: 'OK',
    service: 'rag-service',
    timestamp: new Date().toISOString(),
    embeddings: {
      count: embeddingCount,
      status: embeddingCount > 0 ? 'ready' : 'not_initialized',
    },
    groq: {
      connected: groqConnected,
      status: groqConnected ? 'ready' : 'not_configured',
    },
  });
});

export const getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const embeddingCount = embeddingService.getEmbeddingCount();
  const groqConnected = await groqService.testConnection();

  res.json({
    embeddings: {
      count: embeddingCount,
      status: embeddingCount > 0 ? 'ready' : 'not_initialized',
    },
    groq: {
      connected: groqConnected,
      status: groqConnected ? 'ready' : 'not_configured',
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
