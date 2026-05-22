const express = require('express');
const router = express.Router();
const { getMySubscription, createCheckoutSession, verifySubscriptionPayment } = require('../controllers/subscriptionController');
const { verifyToken } = require('../middleware/auth');
const tenantGuard = require('../middleware/tenantGuard');

// Base path: /api/billing
router.use(verifyToken);
router.use(tenantGuard);

router.get('/my-subscription', getMySubscription);
router.post('/subscribe', createCheckoutSession);
router.post('/verify', verifySubscriptionPayment);

module.exports = router;
