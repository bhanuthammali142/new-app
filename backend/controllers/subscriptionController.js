const db = require('../config/db');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance (using the same keys as the rest of the app, or specific ones if needed)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// GET /api/billing/my-subscription
const getMySubscription = async (req, res) => {
    try {
        const hostelId = req.user.hostel_id;
        if (!hostelId) return res.status(403).json({ success: false, error: 'Hostel not found' });

        // Get student count
        const { rows: [{ student_count }] } = await db.query(
            'SELECT COUNT(*) AS student_count FROM students WHERE hostel_id = $1 AND is_active = TRUE',
            [hostelId]
        );

        // Get active subscription
        let { rows: [subscription] } = await db.query(`
            SELECT s.*, bp.name as plan_name, bp.price, bp.max_students 
            FROM subscriptions s
            JOIN billing_plans bp ON s.plan_id = bp.id
            WHERE s.hostel_id = $1
            ORDER BY s.created_at DESC LIMIT 1
        `, [hostelId]);

        // If no subscription exists, generate a default trialing state for the standard plan
        if (!subscription) {
            const planId = 'plan_standard_999';
            const subId = crypto.randomUUID();
            await db.query(`
                INSERT INTO subscriptions (id, hostel_id, plan_id, status)
                VALUES ($1, $2, $3, 'trialing')
            `, [subId, hostelId, planId]);
            
            // Re-fetch
            const { rows: [newSub] } = await db.query(`
                SELECT s.*, bp.name as plan_name, bp.price, bp.max_students 
                FROM subscriptions s
                JOIN billing_plans bp ON s.plan_id = bp.id
                WHERE s.hostel_id = $1
            `, [hostelId]);
            subscription = newSub;
        }

        res.json({
            success: true,
            data: {
                ...subscription,
                student_count: parseInt(student_count, 10),
                is_capacity_reached: parseInt(student_count, 10) >= subscription.max_students
            }
        });
    } catch (error) {
        console.error('[getMySubscription]', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /api/billing/subscribe
// This simulates creating a checkout session or a Razorpay order for a monthly subscription
const createCheckoutSession = async (req, res) => {
    try {
        const hostelId = req.user.hostel_id;
        const { plan_id } = req.body; // e.g. plan_standard_999

        const { rows: [plan] } = await db.query('SELECT * FROM billing_plans WHERE id = $1', [plan_id]);
        if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

        // Create a standard Razorpay Order (Simulating a subscription setup for now)
        const orderOptions = {
            amount: Math.round(plan.price * 100), // in paise
            currency: 'INR',
            receipt: `sub_${hostelId}_${Date.now()}`
        };

        const order = await razorpay.orders.create(orderOptions);

        res.json({
            success: true,
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                key_id: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        console.error('[createCheckoutSession]', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /api/billing/verify
// Verify the payment and activate the subscription
const verifySubscriptionPayment = async (req, res) => {
    try {
        const hostelId = req.user.hostel_id;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: "Invalid payment signature" });
        }

        const { rows: [plan] } = await db.query('SELECT * FROM billing_plans WHERE id = $1', [plan_id]);
        
        // 1. Log Invoice
        const invoiceId = crypto.randomUUID();
        await db.query(`
            INSERT INTO platform_invoices (id, hostel_id, amount, status, paid_at, razorpay_payment_id)
            VALUES ($1, $2, $3, 'paid', NOW(), $4)
        `, [invoiceId, hostelId, plan.price, razorpay_payment_id]);

        // 2. Update Subscription
        // Give 30 days access
        await db.query(`
            UPDATE subscriptions 
            SET status = 'active', 
                current_period_start = NOW(), 
                current_period_end = NOW() + INTERVAL '30 days',
                plan_id = $1
            WHERE hostel_id = $2
        `, [plan_id, hostelId]);

        res.json({ success: true, message: "Subscription activated successfully!" });
    } catch (error) {
        console.error('[verifySubscriptionPayment]', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getMySubscription,
    createCheckoutSession,
    verifySubscriptionPayment
};
