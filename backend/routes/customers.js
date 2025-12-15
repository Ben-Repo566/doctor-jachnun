const express = require('express');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all customers (admin only)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { search, limit = 50 } = req.query;

        let query = 'SELECT * FROM customers WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY last_order_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [customers] = await pool.query(query, params);

        res.json(customers);

    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single customer with order history (admin only)
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get customer
        const [customers] = await pool.query(
            'SELECT * FROM customers WHERE id = ?',
            [id]
        );

        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const customer = customers[0];

        // Get customer's orders
        const [orders] = await pool.query(
            `SELECT id, order_number, total, status, created_at
            FROM orders
            WHERE customer_id = ?
            ORDER BY created_at DESC
            LIMIT 20`,
            [id]
        );

        customer.orders = orders;

        res.json(customer);

    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get customer by phone (for checkout - check if returning customer)
router.get('/phone/:phone', async (req, res) => {
    try {
        const phone = req.params.phone.replace(/\D/g, '');

        const [customers] = await pool.query(
            'SELECT id, name, email, address FROM customers WHERE phone = ?',
            [phone]
        );

        if (customers.length === 0) {
            return res.json({ found: false });
        }

        res.json({
            found: true,
            customer: customers[0]
        });

    } catch (error) {
        console.error('Get customer by phone error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
