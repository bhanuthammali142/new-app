const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/auth')
const auditLog = require('../middleware/auditLogger')

// Import real controllers
const {
  getDashboardStats, getRevenueByMonth,
  getComplaints, addComplaint, updateComplaint,
  getAnnouncements, addAnnouncement, deleteAnnouncement,
  getAttendance, markAttendance,
  getFoodMenu, saveFoodMenu
} = require('../controllers/miscController')

const { getFees, addFee, generateBulkFees, processPayment, markOverdue, getStudentFees } = require('../controllers/feeController')
const { getStudents, addStudent, updateStudent, deleteStudent } = require('../controllers/studentController')
const { getRooms, addRoom, updateRoom, deleteRoom } = require('../controllers/roomController')
const { getHostels, createHostel, updateHostel, createHostelWithOwner } = require('../controllers/hostelController')

// All routes require auth
router.use(verifyToken)

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboardStats)
router.get('/dashboard/revenue', getRevenueByMonth)

// ── Complaints ───────────────────────────────────────────────────────────────
router.get('/complaints', getComplaints)
router.post('/complaints', auditLog('CREATE_COMPLAINT', 'complaint'), addComplaint)
router.put('/complaints/:id', auditLog('UPDATE_COMPLAINT', 'complaint'), updateComplaint)

// ── Announcements ────────────────────────────────────────────────────────────
router.get('/announcements', getAnnouncements)
router.post('/announcements', auditLog('CREATE_ANNOUNCEMENT', 'announcement'), addAnnouncement)
router.delete('/announcements/:id', auditLog('DELETE_ANNOUNCEMENT', 'announcement'), deleteAnnouncement)

// ── Attendance ───────────────────────────────────────────────────────────────
router.get('/attendance', getAttendance)
router.post('/attendance', auditLog('MARK_ATTENDANCE', 'attendance'), markAttendance)

// ── Food Menu ────────────────────────────────────────────────────────────────
router.get('/food-menu', getFoodMenu)
router.put('/food-menu', auditLog('UPDATE_FOOD_MENU', 'food_menu'), saveFoodMenu)

// ── Fees — order matters: specific routes before /:id ────────────────────────
router.get('/fees/student/:studentId', getStudentFees)
router.post('/fees/generate-bulk', auditLog('GENERATE_BULK_FEES', 'fee'), generateBulkFees)
router.post('/fees/mark-overdue', auditLog('MARK_FEES_OVERDUE', 'fee'), markOverdue)
router.get('/fees', getFees)
router.post('/fees', auditLog('CREATE_FEE', 'fee'), addFee)
router.post('/fees/:id/payment', auditLog('PROCESS_PAYMENT', 'fee'), processPayment)

// ── Students ─────────────────────────────────────────────────────────────────
router.get('/students', getStudents)
router.post('/students', auditLog('ADD_STUDENT', 'student'), addStudent)
router.put('/students/:id', auditLog('UPDATE_STUDENT', 'student'), updateStudent)
router.delete('/students/:id', auditLog('DELETE_STUDENT', 'student'), deleteStudent)

// ── Rooms ────────────────────────────────────────────────────────────────────
router.get('/rooms', getRooms)
router.post('/rooms', auditLog('ADD_ROOM', 'room'), addRoom)
router.put('/rooms/:id', updateRoom)
router.delete('/rooms/:id', deleteRoom)

// Test route
router.get('/test', (req, res) => res.json({ message: 'Misc routes working!' }))

module.exports = router