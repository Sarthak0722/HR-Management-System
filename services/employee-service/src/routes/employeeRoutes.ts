import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController';
import { getMyLeaves, getLeaveById, createLeaveRequest, updateLeaveRequest, cancelLeaveRequest, getLeaveStats } from '../controllers/leaveController';
import { authenticateToken, requireAnyRole } from '../middleware/auth';

const router: Router = Router();

/**
 * @swagger
 * components:
 *   schemas:
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
 *     LeaveRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [SICK_LEAVE, VACATION, PERSONAL_LEAVE, MATERNITY_LEAVE, PATERNITY_LEAVE]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         reason:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         approvedBy:
 *           type: string
 *         approvedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *     CreateLeaveRequest:
 *       type: object
 *       required:
 *         - type
 *         - startDate
 *         - endDate
 *       properties:
 *         type:
 *           type: string
 *           enum: [SICK_LEAVE, VACATION, PERSONAL_LEAVE, MATERNITY_LEAVE, PATERNITY_LEAVE]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         reason:
 *           type: string
 */

// Profile Management Routes

/**
 * @swagger
 * /employee/profile:
 *   get:
 *     summary: Get employee profile
 *     tags: [Profile Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Employee profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 employeeProfile:
 *                   $ref: '#/components/schemas/EmployeeProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/profile', authenticateToken, requireAnyRole, getProfile);

/**
 * @swagger
 * /employee/profile:
 *   put:
 *     summary: Update employee profile
 *     tags: [Profile Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 employeeProfile:
 *                   $ref: '#/components/schemas/EmployeeProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put('/profile', authenticateToken, requireAnyRole, updateProfile);

// Leave Management Routes

/**
 * @swagger
 * /employee/leaves:
 *   get:
 *     summary: Get employee's leave requests
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of leaves per page
 *     responses:
 *       200:
 *         description: List of leave requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaves:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveRequest'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/leaves', authenticateToken, requireAnyRole, getMyLeaves);

/**
 * @swagger
 * /employee/leaves/{id}:
 *   get:
 *     summary: Get leave request by ID
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveRequest'
 *       404:
 *         description: Leave request not found
 *       401:
 *         description: Unauthorized
 */
router.get('/leaves/:id', authenticateToken, requireAnyRole, getLeaveById);

/**
 * @swagger
 * /employee/leaves:
 *   post:
 *     summary: Create leave request
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeaveRequest'
 *     responses:
 *       201:
 *         description: Leave request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveRequest'
 *       400:
 *         description: Validation error or overlapping leave request
 *       401:
 *         description: Unauthorized
 */
router.post('/leaves', authenticateToken, requireAnyRole, createLeaveRequest);

/**
 * @swagger
 * /employee/leaves/{id}:
 *   put:
 *     summary: Update leave request
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeaveRequest'
 *     responses:
 *       200:
 *         description: Leave request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveRequest'
 *       400:
 *         description: Validation error or leave already processed
 *       404:
 *         description: Leave request not found
 *       401:
 *         description: Unauthorized
 */
router.put('/leaves/:id', authenticateToken, requireAnyRole, updateLeaveRequest);

/**
 * @swagger
 * /employee/leaves/{id}:
 *   delete:
 *     summary: Cancel leave request
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request cancelled successfully
 *       400:
 *         description: Leave request already processed
 *       404:
 *         description: Leave request not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/leaves/:id', authenticateToken, requireAnyRole, cancelLeaveRequest);

/**
 * @swagger
 * /employee/leaves/stats:
 *   get:
 *     summary: Get leave statistics
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Leave statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLeaves:
 *                   type: integer
 *                 pendingLeaves:
 *                   type: integer
 *                 approvedLeaves:
 *                   type: integer
 *                 rejectedLeaves:
 *                   type: integer
 *                 leavesByType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/leaves/stats', authenticateToken, requireAnyRole, getLeaveStats);

export default router;
