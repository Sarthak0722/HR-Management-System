import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import qaRoutes from './routes/qaRoutes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import embeddingService from './services/embeddingService';
import { sampleHRPolicies } from './data/hrPolicies';

const app: express.Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (lower for LLM usage)
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Initialize embedding service with HR policies
(async () => {
  try {
    logger.info('Initializing RAG service with HR policies...');
    await embeddingService.initialize();
    await embeddingService.embedPolicies(sampleHRPolicies);
    logger.info('RAG service initialized successfully with HR policies');
  } catch (error) {
    logger.error('Failed to initialize RAG service:', error);
  }
})();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RAG Service API',
      version: '1.0.0',
      description: 'RAG service for HR policy Q&A using Groq LLM',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3004}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'rag-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/qa', qaRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
