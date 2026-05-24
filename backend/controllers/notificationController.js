/**
 * backend/controllers/notificationController.js
 * Handles in-app notification fetching, read status, and counts
 */

const db = require('../config/db');

// ─────────────────────────────────────────────
// GET /api/notifications
// Returns notifications based on user role
// ─────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const hostelId = req.query.hostel_id || req.user.hostel_id;

    let rows;

    if (role === 'student') {
      // Look up student record for this user
      const { rows: studentRows } = await db.query(
        'SELECT id FROM students WHERE user_id = $1',
        [userId]
      );
      const studentId = studentRows[0]?.id;
      if (!studentId) {
        return res.json({ success: true, data: [] });
      }

      const result = await db.query(
        `SELECT * FROM notifications
         WHERE student_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [studentId]
      );
      rows = result.rows;

    } else if (role === 'admin') {
      if (!hostelId) {
        return res.json({ success: true, data: [] });
      }

      const result = await db.query(
        `SELECT n.*, s.full_name AS student_name
         FROM notifications n
         LEFT JOIN students s ON n.student_id = s.id
         WHERE n.hostel_id = $1
         ORDER BY n.created_at DESC
         LIMIT 100`,
        [hostelId]
      );
      rows = result.rows;

    } else if (role === 'super_admin') {
      const result = await db.query(
        `SELECT n.*, s.full_name AS student_name
         FROM notifications n
         LEFT JOIN students s ON n.student_id = s.id
         ORDER BY n.created_at DESC
         LIMIT 200`
      );
      rows = result.rows;

    } else {
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getNotifications]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Mark a single notification as read
// ─────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('[markAsRead]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/notifications/read-all
// Mark all notifications as read for the current user
// ─────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const hostelId = req.user.hostel_id;

    if (role === 'student') {
      const { rows: studentRows } = await db.query(
        'SELECT id FROM students WHERE user_id = $1',
        [userId]
      );
      const studentId = studentRows[0]?.id;
      if (studentId) {
        await db.query(
          'UPDATE notifications SET is_read = TRUE WHERE student_id = $1 AND is_read = FALSE',
          [studentId]
        );
      }
    } else if (role === 'admin' && hostelId) {
      await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE hostel_id = $1 AND is_read = FALSE',
        [hostelId]
      );
    } else if (role === 'super_admin') {
      await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE'
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[markAllAsRead]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/notifications/unread-count
// Returns count of unread notifications
// ─────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const hostelId = req.query.hostel_id || req.user.hostel_id;

    let count = 0;

    if (role === 'student') {
      const { rows: studentRows } = await db.query(
        'SELECT id FROM students WHERE user_id = $1',
        [userId]
      );
      const studentId = studentRows[0]?.id;
      if (studentId) {
        const { rows } = await db.query(
          'SELECT COUNT(*)::int AS count FROM notifications WHERE student_id = $1 AND is_read = FALSE',
          [studentId]
        );
        count = rows[0]?.count || 0;
      }
    } else if (role === 'admin' && hostelId) {
      const { rows } = await db.query(
        'SELECT COUNT(*)::int AS count FROM notifications WHERE hostel_id = $1 AND is_read = FALSE',
        [hostelId]
      );
      count = rows[0]?.count || 0;
    } else if (role === 'super_admin') {
      const { rows } = await db.query(
        'SELECT COUNT(*)::int AS count FROM notifications WHERE is_read = FALSE'
      );
      count = rows[0]?.count || 0;
    }

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('[getUnreadCount]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
