const db = require('../config/db');

/**
 * Middleware to log actions into the audit_logs table.
 * Usage:
 * router.post('/', authMiddleware, auditLog('CREATE_HOSTEL', 'hostel'), createHostel);
 */
const auditLog = (action, entity) => {
    return async (req, res, next) => {
        // We want to capture the request details after it completes to log success/failure
        // but for simplicity, we log it immediately or hook into the response.
        
        // Let's hook into res.on('finish') to log after the request is processed
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                try {
                    const userId = req.user ? req.user.id : null;
                    let entityId = null;
                    
                    // Try to infer entity ID from params or response (if we attach it to res.locals)
                    if (req.params.id) {
                        entityId = req.params.id;
                    } else if (res.locals.insertedId) {
                        entityId = res.locals.insertedId.toString();
                    }

                    const details = JSON.stringify({
                        method: req.method,
                        url: req.originalUrl,
                        ip: req.ip,
                        body: req.method !== 'GET' ? req.body : undefined
                    });

                    await db.query(
                        `INSERT INTO audit_logs (id, user_id, action, entity, entity_id, details)
                         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                        [userId, action, entity, entityId, details]
                    );
                } catch (error) {
                    console.error('[AuditLog Error]', error);
                }
            }
        });
        
        next();
    };
};

module.exports = auditLog;
