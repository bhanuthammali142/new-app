const express = require('express')
const router = express.Router()
const { login, register, me, changePassword } = require('../controllers/authController')
const { verifyToken } = require('../middleware/auth')

// Public routes
router.post('/login', login)
router.post('/register', register)

// Protected routes
router.get('/me', verifyToken, me)
router.put('/me', verifyToken, changePassword)

// Test route to verify router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' })
})

module.exports = router