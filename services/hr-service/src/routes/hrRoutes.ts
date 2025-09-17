import { Router } from 'express';
import { getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, getEmployeeStats } from '../controllers/employeeController';
import { getAllLeaveRequests, getLeaveRequestById, approveLeaveRequest, getLeaveStats } from '../controllers/leaveController';
import { authenticateToken, requireHR } from '../middleware/auth';

const router: Router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
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
 *     LeaveRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
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
 *         user:
 *           $ref: '#/components/schemas/Employee'
 *     UpdateEmployeeRequest:
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
 *         department:
 *           type: string
 *         position:
 *           type: string
 *         salary:
 *           type: number
 *           minimum: 0
 *     LeaveApprovalRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [APPROVED, REJECTED]
 */

// Employee Management Routes

/**
 * @swagger
 * /hr/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [HR Management]
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
 *         description: Number of employees per page
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
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
 *       403:
 *         description: Forbidden - HR role required
 */
router.get('/employees', authenticateToken, requireHR, getAllEmployees);

/**
 * @swagger
 * /hr/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [HR Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - HR role required
 */
router.get('/employees/:id', authenticateToken, requireHR, getEmployeeById);

/**
 * @swagger
 * /hr/employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags: [HR Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEmployeeRequest'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - HR role required
 */
router.put('/employees/:id', authenticateToken, requireHR, updateEmployee);

/**
 * @swagger
 * /hr/employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags: [HR Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - HR role required
 */
router.delete('/employees/:id', authenticateToken, requireHR, deleteEmployee);

/**
 * @swagger
 * /hr/employees/stats:
 *   get:
 *     summary: Get employee statistics
 *     tags: [HR Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Employee statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEmployees:
 *                   type: integer
 *                 employeesByDepartment:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       department:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 recentHires:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - HR role required
 */
router.get('/employees/stats', authenticateToken, requireHR, getEmployeeStats);

// Leave Management Routes

/**
 * @swagger
 * /hr/leaves:
 *   get:
 *     summary: Get all leave requests
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by leave status
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
 *       403:
 *         description: Forbidden - HR role required
 */
router.get('/leaves', authenticateToken, requireHR, getAllLeaveRequests);

/**
 * @swagger
 * /hr/leaves/{id}:
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
 *       403:
 *         description: Forbidden - HR role required
 */
router.get('/leaves/:id', authenticateToken, requireHR, getLeaveRequestById);

/**
 * @swagger
 * /hr/leaves/{id}/approve:
 *   put:
 *     summary: Approve or reject leave request
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
 *             $ref: '#/components/schemas/LeaveApprovalRequest'
 *     responses:
 *       200:
 *         description: Leave request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveRequest'
 *       400:
 *         description: Leave request already processed
 *       404:
 *         description: Leave request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - HR role required
 */
router.put('/leaves/:id/approve', authenticateToken, requireHR, approveLeaveRequest);

/**
 * @swagger
 * /hr/leaves/stats:
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
 *       403:
 *         description: Forbidden - HR role required
 */
router.get('/leaves/stats', authenticateToken, requireHR, getLeaveStats);

export default router;
