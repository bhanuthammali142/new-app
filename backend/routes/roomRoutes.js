const express = require('express')
const router  = express.Router()
const { getRooms, addRoom, updateRoom, deleteRoom } = require('../controllers/roomController')
const { verifyToken, checkRole } = require('../middleware/auth')

const tenantGuard = require('../middleware/tenantGuard');
router.use(verifyToken);
router.use(tenantGuard);

router.get('/',     getRooms)
router.post('/',    checkRole('admin','super_admin'), addRoom)
router.put('/:id',  checkRole('admin','super_admin'), updateRoom)
router.delete('/:id', checkRole('admin','super_admin'), deleteRoom)

module.exports = router
