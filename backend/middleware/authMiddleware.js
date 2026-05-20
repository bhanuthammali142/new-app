/**
 * authMiddleware.js — re-exports verifyToken + roleMiddleware
 * so that superAdminRoutes.js can: require('../middleware/authMiddleware')
 */
const { verifyToken, checkRole } = require('./auth')

const authMiddleware = verifyToken

const roleMiddleware = (roles) => checkRole(...roles)

module.exports = { authMiddleware, roleMiddleware }
