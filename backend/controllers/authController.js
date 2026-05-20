const jwt = require('jsonwebtoken')
const db = require('../config/db')

// JWT_SECRET is validated on server startup in server.js
const JWT_SECRET = process.env.JWT_SECRET

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        console.log('🔐 Login attempt:', email)

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' })
        }

        // Find user
        const { rows: users } = await db.query(
            'SELECT id, email, password, role FROM users WHERE email = $1 AND is_active = TRUE',
            [email]
        )

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const user = users[0]

        // Plain-text password check (matching schema seed; students use bcrypt — handled below)
        let passwordMatch = (password === user.password)

        // Also try bcrypt in case the password was hashed (student accounts)
        if (!passwordMatch) {
            try {
                const bcrypt = require('bcryptjs')
                passwordMatch = await bcrypt.compare(password, user.password)
            } catch (_) {
                // bcrypt compare failed — not a hashed password
            }
        }

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        // Update last login
        await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

        // Get display name & hostel_id based on role
        let name = ''
        let hostelId = null

        if (user.role === 'super_admin') {
            const { rows: admin } = await db.query(
                'SELECT name FROM super_admins WHERE user_id = $1',
                [user.id]
            )
            name = admin[0]?.name || 'Super Admin'
            hostelId = null  // super_admin has no single hostel

        } else if (user.role === 'admin') {
            const { rows: owner } = await db.query(
                'SELECT owner_name AS name FROM hostel_owners WHERE user_id = $1',
                [user.id]
            )
            name = owner[0]?.name || 'Hostel Owner'

            // ── FIXED: resolve hostel_id for admin ──────────────────────────
            const { rows: hostelRows } = await db.query(
                `SELECT h.id AS hostel_id
                   FROM hostels h
                   JOIN hostel_owners ho ON ho.id = h.owner_id
                  WHERE ho.user_id = $1
                  LIMIT 1`,
                [user.id]
            )
            hostelId = hostelRows[0]?.hostel_id
                ? String(hostelRows[0].hostel_id)
                : null

        } else {
            // student
            const { rows: student } = await db.query(
                'SELECT full_name AS name, hostel_id FROM students WHERE user_id = $1',
                [user.id]
            )
            name = student[0]?.name || 'Student'
            hostelId = student[0]?.hostel_id
                ? String(student[0].hostel_id)
                : null
        }

        // Build token payload — include hostel_id so all API calls work
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            name,
            hostel_id: hostelId
        }

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

        res.json({
            success: true,
            token,
            user: payload
        })

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Server error' })
    }
}

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password required' })
        }

        const conn = await db.connect()
        try {
            await conn.query('BEGIN')

            const { rows: existing } = await conn.query('SELECT id FROM users WHERE email = $1', [email])
            if (existing.length > 0) {
                await conn.query('ROLLBACK')
                conn.release()
                return res.status(400).json({ error: 'Email already exists' })
            }

            const bcrypt = require('bcryptjs')
            const hashedPassword = await bcrypt.hash(password, 12)

            const { rows: userResult } = await conn.query(
                'INSERT INTO users (email, password, role, is_active) VALUES ($1, $2, $3, $4) RETURNING id',
                [email, hashedPassword, 'admin', true]
            )

            await conn.query(
                'INSERT INTO hostel_owners (user_id, owner_name, owner_email) VALUES ($1, $2, $3) RETURNING id',
                [userResult[0].id, name, email]
            )

            await conn.query('COMMIT')
            conn.release()

            const payload = {
                id: userResult[0].id,
                email,
                role: 'admin',
                name,
                hostel_id: null
            }
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

            res.json({ success: true, token, user: payload })
        } catch (error) {
            await conn.query('ROLLBACK')
            conn.release()
            throw error
        }
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ error: 'Server error' })
    }
}

// GET /api/auth/me — returns fresh user info from DB
const me = async (req, res) => {
    try {
        const userId = req.user.id
        const { rows: users } = await db.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [userId]
        )
        if (users.length === 0) return res.status(404).json({ error: 'User not found' })

        const user = users[0]
        let name = ''
        let hostelId = null

        if (user.role === 'super_admin') {
            const { rows: admin } = await db.query('SELECT name FROM super_admins WHERE user_id = $1', [userId])
            name = admin[0]?.name || 'Super Admin'
        } else if (user.role === 'admin') {
            const { rows: owner } = await db.query('SELECT owner_name AS name FROM hostel_owners WHERE user_id = $1', [userId])
            name = owner[0]?.name || 'Hostel Owner'
            const { rows: hostelRows } = await db.query(
                'SELECT h.id AS hostel_id FROM hostels h JOIN hostel_owners ho ON ho.id = h.owner_id WHERE ho.user_id = $1 LIMIT 1',
                [userId]
            )
            hostelId = hostelRows[0]?.hostel_id ? String(hostelRows[0].hostel_id) : null
        } else {
            const { rows: student } = await db.query('SELECT full_name AS name, hostel_id FROM students WHERE user_id = $1', [userId])
            name = student[0]?.name || 'Student'
            hostelId = student[0]?.hostel_id ? String(student[0].hostel_id) : null
        }

        res.json({ id: user.id, email: user.email, role: user.role, name, hostel_id: hostelId })
    } catch (error) {
        console.error('Me error:', error)
        res.status(500).json({ error: 'Server error' })
    }
}

const changePassword = async (req, res) => {
    const { newPassword } = req.body
    if (!newPassword) return res.status(400).json({ error: 'newPassword required' })
    try {
        const bcrypt = require('bcryptjs')
        const hash = await bcrypt.hash(newPassword, 12)
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id])
        res.json({ success: true, message: 'Password updated' })
    } catch (error) {
        console.error('changePassword error:', error)
        res.status(500).json({ error: 'Server error' })
    }
}

module.exports = { login, register, me, changePassword }