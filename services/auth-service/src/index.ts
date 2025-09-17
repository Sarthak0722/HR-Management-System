import app from './app';
import { PrismaClient } from '@prisma/client';
import logger from './utils/logger';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
