import app from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  logger.info(`Employee service running on port ${PORT}`);
  logger.info(`API documentation available at http://localhost:${PORT}/docs`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});
