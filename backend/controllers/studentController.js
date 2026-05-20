const pool   = require('../config/db')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// GET /api/students?hostel_id=xxx
async function getStudents(req, res) {
  const hostelId = req.query.hostel_id || req.user.hostel_id
  if (!hostelId) return res.status(400).json({ error: 'hostel_id required' })

  try {
    const { rows: rows } = await pool.query(
      `SELECT s.*,
              r.room_number, r.type AS room_type, r.monthly_fee,
              b.bed_number
       FROM students s
       LEFT JOIN rooms r ON r.id = s.room_id
       LEFT JOIN beds  b ON b.id = s.bed_id
       WHERE s.hostel_id = $1
       ORDER BY s.created_at DESC`,
      [hostelId]
    )
    res.json(rows)
  } catch (err) {
    console.error('[getStudents]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/students
async function addStudent(req, res) {
  const {
    hostel_id, full_name, email, phone, parent_phone,
    id_number, college_name, branch, joining_date,
    room_id, bed_id
  } = req.body

  if (!full_name || !hostel_id || !room_id || !bed_id) return res.status(400).json({ error: 'full_name, hostel_id, room_id, and bed_id required' })

  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')

    // Create user account for student if email provided
    let userId = null
    let credentials = null
    if (email) {
      const { rows: existing } = await conn.query('SELECT id FROM users WHERE email = $1', [email])
      if (existing.length > 0) {
        userId = existing[0].id
      } else {
        // Generate a readable temp password
        const tempPassword = Math.random().toString(36).slice(2, 10) + 'Ab@1'
        const hash = await bcrypt.hash(tempPassword, 12)

        // FIXED: Do NOT pass id — let MySQL AUTO_INCREMENT assign it
        const { rows: insertResult } = await conn.query(
          'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
          [email, hash, 'student']
        )
        userId = insertResult[0].id   // <-- use the generated INT id
        credentials = { email, password: tempPassword }
      }
    }

    const studentId = crypto.randomUUID()
    await conn.query(
      `INSERT INTO students
       (id, hostel_id, user_id, room_id, bed_id, full_name, email, phone, parent_phone,
        id_number, college_name, branch, joining_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        studentId, hostel_id, userId, room_id || null, bed_id || null,
        full_name, email || null, phone || null, parent_phone || null,
        id_number || null, college_name || null, branch || null, joining_date || null
      ]
    )

    // Mark bed as occupied
    if (bed_id) {
      await conn.query("UPDATE beds SET status = 'occupied' WHERE id = $1", [bed_id])
    }

    // Auto-create current month fee if room assigned
    if (room_id) {
      const { rows: roomRows } = await conn.query('SELECT monthly_fee FROM rooms WHERE id = $1', [room_id])
      const fee = Number(roomRows[0]?.monthly_fee)
      if (fee > 0) {
        const now = new Date()
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0]
        const dueDate   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 5)).toISOString().split('T')[0]
        await conn.query(
          `INSERT INTO fees (id, hostel_id, student_id, amount, due_amount, month, due_date, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [crypto.randomUUID(), hostel_id, studentId, fee, fee, monthStart, dueDate, 'pending']
        )
      }
    }

    await conn.query('COMMIT')
    conn.release()

    const { rows: rows } = await pool.query(
      `SELECT s.*, r.room_number, b.bed_number
         FROM students s
         LEFT JOIN rooms r ON r.id = s.room_id
         LEFT JOIN beds  b ON b.id = s.bed_id
        WHERE s.id = $1`,
      [studentId]
    )
    res.status(201).json({ student: rows[0], credentials })
  } catch (err) {
    await conn.query('ROLLBACK')
    conn.release()
    console.error('[addStudent]', err)
    res.status(500).json({ error: err.message || 'Server error' })
  }
}

// PUT /api/students/:id
async function updateStudent(req, res) {
  const { id } = req.params
  const fields = req.body
  const allowed = [
    'full_name', 'email', 'phone', 'parent_phone', 'id_number',
    'college_name', 'branch', 'joining_date', 'room_id', 'bed_id', 'is_verified'
  ]
  const updates = Object.keys(fields).filter(k => allowed.includes(k))
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' })

  try {
    // Build SET clause with PostgreSQL numbered placeholders
    const setClause = updates.map((k, i) => `${k} = $${i + 1}`).join(', ')
    const vals = [...updates.map(k => fields[k]), id]
    // WHERE clause uses the next placeholder number
    const wherePlaceholder = `$${updates.length + 1}`
    await pool.query(`UPDATE students SET ${setClause} WHERE id = ${wherePlaceholder}`, vals)
    res.json({ success: true })
  } catch (err) {
    console.error('[updateStudent]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// DELETE /api/students/:id
async function deleteStudent(req, res) {
  const { id } = req.params
  try {
    const { rows: rows } = await pool.query('SELECT bed_id FROM students WHERE id = $1', [id])
    if (rows[0]?.bed_id) {
      await pool.query("UPDATE beds SET status = 'available' WHERE id = $1", [rows[0].bed_id])
    }
    await pool.query('DELETE FROM students WHERE id = $1', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('[deleteStudent]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { getStudents, addStudent, updateStudent, deleteStudent }