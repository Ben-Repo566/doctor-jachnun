const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find admin
        const [rows] = await pool.query(
            'SELECT * FROM admins WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify token / Get current admin
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, email, name FROM admins WHERE id = ?',
            [req.admin.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get current admin
        const [rows] = await pool.query(
            'SELECT * FROM admins WHERE id = ?',
            [req.admin.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.query(
            'UPDATE admins SET password = ? WHERE id = ?',
            [hashedPassword, req.admin.id]
        );

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create admin (for initial setup)
router.post('/setup', async (req, res) => {
    try {
        const { email, password, name, setupKey } = req.body;

        // Simple security - require a setup key
        if (setupKey !== 'doctor-jachnun-setup-2024') {
            return res.status(403).json({ error: 'Invalid setup key' });
        }

        // Check if admin already exists
        const [existing] = await pool.query(
            'SELECT id FROM admins WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Admin already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin
        const [result] = await pool.query(
            'INSERT INTO admins (email, password, name) VALUES (?, ?, ?)',
            [email, hashedPassword, name]
        );

        res.json({
            message: 'Admin created successfully',
            adminId: result.insertId
        });

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
