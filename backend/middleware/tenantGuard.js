/**
 * backend/middleware/tenantGuard.js
 * Enforces multi-tenant security by validating hostel access
 * Ensures users can only access hostels they own/manage
 */

const tenantGuard = async (req, res, next) => {
  // Get hostel_id from query, body, or params
  const requestedHostelId = req.query.hostel_id || req.body.hostel_id || req.params.hostel_id;
  
  // If no hostel specified, continue (some endpoints don't require it)
  if (!requestedHostelId) {
    return next();
  }

  // Super admins can access any hostel
  if (req.user?.role === 'super_admin') {
    return next();
  }

  // For admins, verify the hostel_id matches their assigned hostel
  if (req.user?.role === 'admin') {
    const userHostelId = String(req.user.hostel_id);
    const requestedId = String(requestedHostelId);

    if (userHostelId !== requestedId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this hostel'
      });
    }
  }

  // For students, verify they belong to this hostel
  if (req.user?.role === 'student') {
    const userHostelId = String(req.user.hostel_id);
    const requestedId = String(requestedHostelId);

    if (userHostelId !== requestedId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - student does not belong to this hostel'
      });
    }
  }

  next();
};

module.exports = tenantGuard;
