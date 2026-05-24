/**
 * backend/jobs/feeReminderJob.js
 * Cron job to check for upcoming/overdue fees and create notifications
 *
 * Usage:
 *   node jobs/feeReminderJob.js
 *
 * Schedule with cron (daily at midnight):
 *   0 0 * * * cd /path/to/backend && node jobs/feeReminderJob.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');
const crypto = require('crypto');

async function runFeeReminders() {
  console.log('🔔 Starting fee reminder job...');
  let reminderCount = 0;

  try {
    // Find fees that are pending/overdue and due within the next 3 days
    const { rows: upcomingFees } = await db.query(
      `SELECT f.id AS fee_id, f.student_id, f.hostel_id, f.due_amount, f.month, f.due_date, f.status,
              s.email AS student_email, s.full_name AS student_name
       FROM fees f
       JOIN students s ON s.id = f.student_id
       WHERE f.status IN ('pending', 'overdue')
         AND f.due_date <= NOW() + INTERVAL '3 days'
       ORDER BY f.due_date ASC`
    );

    console.log(`📋 Found ${upcomingFees.length} fees needing reminders`);

    for (const fee of upcomingFees) {
      // Check if we already sent a reminder for this fee in the last 24 hours
      const { rows: existingReminders } = await db.query(
        `SELECT id FROM notifications
         WHERE student_id = $1
           AND type = 'fee_reminder'
           AND created_at >= NOW() - INTERVAL '24 hours'
           AND message LIKE $2
         LIMIT 1`,
        [fee.student_id, `%${fee.fee_id}%`]
      );

      if (existingReminders.length > 0) {
        continue; // Already reminded recently
      }

      const monthLabel = fee.month
        ? new Date(fee.month).toLocaleString('default', { month: 'long', year: 'numeric' })
        : 'Unknown';
      const dueLabel = fee.due_date
        ? new Date(fee.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
        : 'soon';

      const isOverdue = fee.status === 'overdue';
      const message = isOverdue
        ? `⚠️ Fee of ₹${fee.due_amount} for ${monthLabel} is overdue! Please pay immediately. (Ref: ${fee.fee_id})`
        : `Fee of ₹${fee.due_amount} for ${monthLabel} is due on ${dueLabel}. Pay on time to earn reward points! (Ref: ${fee.fee_id})`;

      await db.query(
        `INSERT INTO notifications (id, hostel_id, student_id, type, message)
         VALUES ($1, $2, $3, 'fee_reminder', $4)`,
        [crypto.randomUUID(), fee.hostel_id, fee.student_id, message]
      );

      // Send Gmail reminder
      if (fee.student_email) {
        const { sendFeeReminderEmail } = require('../utils/emailService');
        try {
          await sendFeeReminderEmail(
            fee.student_email,
            fee.student_name,
            monthLabel,
            fee.due_amount,
            fee.due_date
          );
        } catch (mailErr) {
          console.error(`Failed to send fee reminder email to ${fee.student_email}:`, mailErr);
        }
      }

      reminderCount++;
    }

    console.log(`✅ Fee reminder job complete. Sent ${reminderCount} reminders.`);
  } catch (error) {
    console.error('❌ Fee reminder job failed:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

runFeeReminders();
