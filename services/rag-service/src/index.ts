import app from './app';
import embeddingService from './services/embeddingService';
import groqService from './services/groqService';
import logger from './utils/logger';
import hrPolicies from './data/hr-policies.json';
import { HRPolicy } from './types';

const PORT = process.env.PORT || 3004;

async function startServer() {
  try {
    // Initialize embedding service
    logger.info('Initializing RAG service...');
    await embeddingService.initialize();
    
    // Embed HR policies
    await embeddingService.embedPolicies(hrPolicies as HRPolicy[]);
    
    // Test Groq connection
    const groqConnected = await groqService.testConnection();
    if (groqConnected) {
      logger.info('Groq API connection successful');
    } else {
      logger.warn('Groq API connection failed - check GROQ_API_KEY');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`RAG service running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/docs`);
      logger.info(`Embedded ${embeddingService.getEmbeddingCount()} HR policies`);
    });
  } catch (error) {
    logger.error('Failed to start RAG service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

startServer();
