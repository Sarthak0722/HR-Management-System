import { Router } from 'express';
import { login, register, createEmployee, logout, getProfile } from '../controllers/authController';
import { authenticateToken, requireHR, requireHRorAdmin } from '../middleware/auth';

const router: Router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [HR, EMPLOYEE]
 *         employeeProfile:
 *           $ref: '#/components/schemas/EmployeeProfile'
 *     EmployeeProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         department:
 *           type: string
 *         position:
 *           type: string
 *         salary:
 *           type: number
 *         hireDate:
 *           type: string
 *           format: date-time
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         department:
 *           type: string
 *         position:
 *           type: string
 *         salary:
 *           type: number
 *           minimum: 0
 *     CreateEmployeeRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         department:
 *           type: string
 *         position:
 *           type: string
 *         salary:
 *           type: number
 *           minimum: 0
 *         hireDate:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: User already exists or validation error
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/employee:
 *   post:
 *     summary: Create new employee (HR only)
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployeeRequest'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - HR role required
 *       400:
 *         description: User already exists or validation error
 */
router.post('/employee', authenticateToken, requireHRorAdmin, createEmployee);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticateToken, getProfile);

export default router;
