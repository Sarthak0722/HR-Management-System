import { Router } from 'express';
import { askQuestion, getHealth, getStats } from '../controllers/qaController';

const router: Router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     QARequest:
 *       type: object
 *       required:
 *         - question
 *       properties:
 *         question:
 *           type: string
 *           description: The question to ask about HR policies
 *         maxResults:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 3
 *           description: Maximum number of relevant policies to consider
 *     QAResponse:
 *       type: object
 *       properties:
 *         answer:
 *           type: string
 *           description: The generated answer based on HR policies
 *         sources:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *           description: The HR policies used to generate the answer
 *         confidence:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Confidence score of the answer
 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         service:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         embeddings:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *             status:
 *               type: string
 *               enum: [ready, not_initialized]
 *         groq:
 *           type: object
 *           properties:
 *             connected:
 *               type: boolean
 *             status:
 *               type: string
 *               enum: [ready, not_configured]
 */

/**
 * @swagger
 * /qa:
 *   post:
 *     summary: Ask a question about HR policies
 *     tags: [Q&A]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QARequest'
 *     responses:
 *       200:
 *         description: Answer generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QAResponse'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post('/', askQuestion);

/**
 * @swagger
 * /qa/health:
 *   get:
 *     summary: Get service health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/health', getHealth);

/**
 * @swagger
 * /qa/stats:
 *   get:
 *     summary: Get service statistics
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Service statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 embeddings:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                     status:
 *                       type: string
 *                 groq:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                 uptime:
 *                   type: number
 *                 memory:
 *                   type: object
 */
router.get('/stats', getStats);

export default router;
