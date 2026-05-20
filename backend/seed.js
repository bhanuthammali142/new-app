/**
 * backend/seed.js
 * Seeds the default super admin account.
 * PostgreSQL version using $1, $2 placeholders
 * Run: node seed.js
 */

const bcrypt = require('bcryptjs')
const pool   = require('./config/db')

async function seedSuperAdmin() {
  try {
    console.log('🌱 Starting seed process...')

    const email    = 'admin@hostel.com'
    const password = 'Bhanu@2006'

    // Check if already exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND role = $2',
      [email, 'super_admin']
    )

    if (existing.length > 0) {
      const existingId = existing[0].id
      console.log('ℹ️  Super admin already exists with id:', existingId)

      // Update password to plain-text (matches authController plain-text check)
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2 AND role = $3',
        [password, email, 'super_admin']
      )

      // Ensure super_admins profile row exists
      const { rows: profile } = await pool.query('SELECT id FROM super_admins WHERE user_id = $1', [existingId])
      if (profile.length === 0) {
        await pool.query(
          'INSERT INTO super_admins (user_id, name, phone) VALUES ($1, $2, $3)',
          [existingId, 'Bhanu Super Admin', '9999999999']
        )
        console.log('✅ super_admins profile row created')
      }

      console.log('✅ Password reset to:', password)
      process.exit(0)
    }

    // PostgreSQL: Use RETURNING clause to get the inserted id
    const { rows: result } = await pool.query(
      'INSERT INTO users (email, password, role, is_active) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, password, 'super_admin', true]
    )
    const newUserId = result[0].id

    // Create super_admins profile
    await pool.query(
      'INSERT INTO super_admins (user_id, name, phone) VALUES ($1, $2, $3)',
      [newUserId, 'Bhanu Super Admin', '9999999999']
    )

    console.log('✅ Super admin created!')
    console.log('')
    console.log('📧 Email:    admin@hostel.com')
    console.log('🔐 Password: Bhanu@2006')
    console.log('👤 Role:     super_admin')
    console.log('🔢 User ID: ', newUserId)
    console.log('')

    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err.message)
    console.error(err)
    process.exit(1)
  }
}

seedSuperAdmin()