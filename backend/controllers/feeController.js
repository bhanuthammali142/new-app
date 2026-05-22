const pool   = require('../config/db')
const crypto = require('crypto')

// GET /api/fees?hostel_id=xxx
async function getFees(req, res) {
  const hostelId = req.query.hostel_id || req.user.hostel_id
  if (!hostelId) return res.status(400).json({ error: 'hostel_id required' })
  try {
    // backend/schema.sql: students uses full_name column
    const { rows: rows } = await pool.query(
      `SELECT f.*, s.full_name AS student_name, r.room_number
       FROM fees f
       JOIN students s ON s.id = f.student_id
       LEFT JOIN rooms r ON r.id = s.room_id
       WHERE f.hostel_id = $1
       ORDER BY f.created_at DESC`,
      [hostelId]
    )
    res.json(rows)
  } catch (err) {
    console.error('[getFees]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/fees
async function addFee(req, res) {
  const { hostel_id, student_id, amount, month, due_date } = req.body
  if (!hostel_id || !student_id || !amount || !month) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  try {
    const id = crypto.randomUUID()
    await pool.query(
      'INSERT INTO fees (id, hostel_id, student_id, amount, due_amount, month, due_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [id, hostel_id, student_id, amount, amount, month, due_date || null, 'pending']
    )
    res.status(201).json({ id, success: true })
  } catch (err) {
    console.error('[addFee]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/fees/generate-bulk
async function generateBulkFees(req, res) {
  const { hostel_id, month, due_date } = req.body
  if (!hostel_id || !month) return res.status(400).json({ error: 'hostel_id and month required' })

  const parsedMonth = new Date(month)
  const normMonth = new Date(Date.UTC(parsedMonth.getFullYear(), parsedMonth.getMonth(), 1))
    .toISOString().split('T')[0]
  const nextMonth = new Date(Date.UTC(parsedMonth.getFullYear(), parsedMonth.getMonth() + 1, 1))
    .toISOString().split('T')[0]

  try {
    // backend/schema.sql: rooms has monthly_fee column
    const { rows: students } = await pool.query(
      'SELECT s.id, r.monthly_fee FROM students s JOIN rooms r ON r.id = s.room_id WHERE s.hostel_id = $1 AND s.room_id IS NOT NULL',
      [hostel_id]
    )
    const { rows: existing } = await pool.query(
      'SELECT student_id FROM fees WHERE hostel_id = $1 AND month >= $2 AND month < $3',
      [hostel_id, normMonth, nextMonth]
    )
    const existingIds = new Set(existing.map(e => e.student_id))

    let created = 0
    for (const s of students) {
      if (!existingIds.has(s.id) && Number(s.monthly_fee) > 0) {
        await pool.query(
          'INSERT INTO fees (id, hostel_id, student_id, amount, due_amount, month, due_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
          [crypto.randomUUID(), hostel_id, s.id, s.monthly_fee, s.monthly_fee, normMonth, due_date || null, 'pending']
        )
        created++
      }
    }
    res.json({ created })
  } catch (err) {
    console.error('[generateBulkFees]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/fees/:id/payment
async function processPayment(req, res) {
  const { id } = req.params
  const { amount_paid, payment_method, paid_at } = req.body
  if (!amount_paid) return res.status(400).json({ error: 'amount_paid required' })

  try {
    const { rows: feeRows } = await pool.query('SELECT * FROM fees WHERE id = $1', [id])
    const fee = feeRows[0]
    if (!fee) return res.status(404).json({ error: 'Fee not found' })

    // Validate permission
    if (req.user.role !== 'super_admin' && req.user.hostel_id !== String(fee.hostel_id)) {
        return res.status(403).json({ error: 'Access denied to this fee' })
    }

    const newPaidAmount = Number(fee.paid_amount) + Number(amount_paid)
    const newDueAmount  = Number(fee.amount) - newPaidAmount
    let newStatus = 'pending'
    if (newPaidAmount >= Number(fee.amount)) newStatus = 'paid'
    else if (newPaidAmount > 0) newStatus = 'partial'

    const receiptId = `REC-${Date.now()}`
    await pool.query(
      `UPDATE fees SET status=$1, paid_amount=$2, due_amount=$3, paid_at=$4, receipt_id=$5 WHERE id=$6`,
      [
        newStatus,
        newPaidAmount,
        Math.max(0, newDueAmount),
        newStatus === 'paid' ? (paid_at || new Date().toISOString()) : null,
        newStatus === 'paid' ? receiptId : null,
        id
      ]
    )

    // Insert payment record
    await pool.query(
      'INSERT INTO payments (id, hostel_id, fee_id, student_id, amount, payment_method, transaction_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [crypto.randomUUID(), fee.hostel_id, id, fee.student_id, amount_paid, payment_method || 'cash', receiptId]
    )

    res.json({ success: true, receipt_id: receiptId, status: newStatus })
  } catch (err) {
    console.error('[processPayment]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/fees/mark-overdue
async function markOverdue(req, res) {
  const { hostel_id } = req.body
  if (!hostel_id) return res.status(400).json({ error: 'hostel_id required' })
  const today = new Date().toISOString().split('T')[0]
  try {
    const { rows: result } = await pool.query(
      "UPDATE fees SET status='overdue' WHERE hostel_id=$1 AND status='pending' AND due_date < $2 AND due_date IS NOT NULL",
      [hostel_id, today]
    )
    res.json({ updated: result.affectedRows })
  } catch (err) {
    console.error('[markOverdue]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// GET /api/fees/student/:studentId
async function getStudentFees(req, res) {
  const { studentId } = req.params
  if (!studentId) return res.json([])
  try {
    const { rows: rows } = await pool.query(
      'SELECT * FROM fees WHERE student_id = $1 ORDER BY month DESC',
      [studentId]
    )
    res.json(rows)
  } catch (err) {
    console.error('[getStudentFees]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { getFees, addFee, generateBulkFees, processPayment, markOverdue, getStudentFees }