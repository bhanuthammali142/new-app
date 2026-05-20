const express = require('express');
const router  = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const ctrl = require('../controllers/superAdminController');

// All routes require super_admin role
router.use(verifyToken);
router.use(checkRole('super_admin'));

// Dashboard
router.get('/dashboard',          ctrl.getDashboardStats);
router.get('/revenue-summary',    ctrl.getRevenueSummary);

// Users
router.get('/users',              ctrl.getAllUsers);
router.patch('/users/:id/status', ctrl.toggleUserStatus);
router.patch('/users/:id/role',   ctrl.changeUserRole);
router.patch('/users/:id/reset-password', ctrl.resetUserPassword);

// Hostels
router.get('/hostels',                 ctrl.getAllHostels);
router.patch('/hostels/:id/status',    ctrl.toggleHostelStatus);

// Students
router.get('/students',           ctrl.getAllStudents);

// Finance
router.get('/payments',           ctrl.getAllPayments);
router.get('/fees',               ctrl.getAllFees);

// Complaints
router.get('/complaints',               ctrl.getAllComplaints);
router.patch('/complaints/:id',         ctrl.updateComplaintStatus);

// Audit Logs
router.get('/audit-logs',         ctrl.getAuditLogs);

// Notifications
router.get('/notifications',      ctrl.getNotifications);
router.post('/notifications',     ctrl.sendNotification);

module.exports = router;
