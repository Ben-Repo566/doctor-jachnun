const express = require('express');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Generate unique order number
function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DJ-${timestamp}-${random}`;
}

// Create new order (public - customers)
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { customer, delivery, payment, items, totals, notes } = req.body;

        // Validate required fields
        if (!customer?.name || !customer?.phone || !items?.length) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find or create customer
        let customerId = null;
        const phone = customer.phone.replace(/\D/g, '');

        const [existingCustomer] = await connection.query(
            'SELECT id FROM customers WHERE phone = ?',
            [phone]
        );

        if (existingCustomer.length > 0) {
            customerId = existingCustomer[0].id;

            // Update customer info
            await connection.query(
                `UPDATE customers SET
                    name = ?,
                    email = COALESCE(?, email),
                    address = COALESCE(?, address),
                    order_count = order_count + 1,
                    total_spent = total_spent + ?,
                    last_order_at = NOW()
                WHERE id = ?`,
                [customer.name, customer.email, customer.address, totals.total, customerId]
            );
        } else {
            // Create new customer
            const [newCustomer] = await connection.query(
                `INSERT INTO customers (name, phone, email, address, order_count, total_spent, last_order_at)
                VALUES (?, ?, ?, ?, 1, ?, NOW())`,
                [customer.name, phone, customer.email, customer.address, totals.total]
            );
            customerId = newCustomer.insertId;
        }

        // Create order
        const orderNumber = generateOrderNumber();

        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                order_number, customer_id, customer_name, customer_phone,
                customer_email, customer_address, delivery_zone, delivery_zone_name,
                delivery_fee, payment_method, subtotal, total, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                orderNumber, customerId, customer.name, phone,
                customer.email, customer.address, delivery.zone, delivery.zoneName,
                delivery.fee, payment.method, totals.subtotal, totals.total, notes
            ]
        );

        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (order_id, item_id, item_name, item_price, quantity, total)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, item.id, item.name, item.price, item.quantity, item.total]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: 'Order created successfully',
            orderId: orderId,
            orderNumber: orderNumber
        });

    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        connection.release();
    }
});

// Get order status (public - for customers)
router.get('/status/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;

        const [orders] = await pool.query(
            `SELECT o.*,
                JSON_ARRAYAGG(
                    JSON_OBJECT('name', oi.item_name, 'quantity', oi.quantity, 'total', oi.total)
                ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.order_number = ?
            GROUP BY o.id`,
            [orderNumber]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        res.json({
            orderNumber: order.order_number,
            status: order.status,
            items: JSON.parse(order.items),
            totals: {
                subtotal: order.subtotal,
                delivery: order.delivery_fee,
                total: order.total
            },
            payment: {
                method: order.payment_method
            },
            createdAt: order.created_at,
            confirmedAt: order.confirmed_at
        });

    } catch (error) {
        console.error('Get order status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all orders (admin only)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { status, date, limit = 50 } = req.query;

        let query = `
            SELECT o.*,
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT('name', oi.item_name, 'quantity', oi.quantity, 'total', oi.total)
                ) FROM order_items oi WHERE oi.order_id = o.id) as items
            FROM orders o
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ' AND o.status = ?';
            params.push(status);
        }

        if (date) {
            query += ' AND DATE(o.created_at) = ?';
            params.push(date);
        }

        query += ' ORDER BY o.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [orders] = await pool.query(query, params);

        // Parse items JSON
        const ordersWithItems = orders.map(order => ({
            ...order,
            items: order.items ? JSON.parse(order.items) : []
        }));

        res.json(ordersWithItems);

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single order (admin only)
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [orders] = await pool.query(
            `SELECT o.*,
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT('name', oi.item_name, 'quantity', oi.quantity, 'price', oi.item_price, 'total', oi.total)
                ) FROM order_items oi WHERE oi.order_id = o.id) as items
            FROM orders o
            WHERE o.id = ?`,
            [id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];
        order.items = order.items ? JSON.parse(order.items) : [];

        res.json(order);

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update order status (admin only)
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Set timestamp field based on status
        let timestampField = '';
        if (status === 'confirmed') timestampField = ', confirmed_at = NOW()';
        if (status === 'completed') timestampField = ', completed_at = NOW()';
        if (status === 'cancelled') timestampField = ', cancelled_at = NOW()';

        await pool.query(
            `UPDATE orders SET status = ? ${timestampField} WHERE id = ?`,
            [status, id]
        );

        res.json({ message: 'Order status updated', status });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get order stats (admin only)
router.get('/stats/summary', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Pending orders count
        const [[{ pendingCount }]] = await pool.query(
            "SELECT COUNT(*) as pendingCount FROM orders WHERE status = 'pending'"
        );

        // Today's orders
        const [[{ todayCount }]] = await pool.query(
            'SELECT COUNT(*) as todayCount FROM orders WHERE DATE(created_at) = ?',
            [today]
        );

        // Today's revenue
        const [[{ todayRevenue }]] = await pool.query(
            "SELECT COALESCE(SUM(total), 0) as todayRevenue FROM orders WHERE DATE(created_at) = ? AND status != 'cancelled'",
            [today]
        );

        // Total customers
        const [[{ customerCount }]] = await pool.query(
            'SELECT COUNT(*) as customerCount FROM customers'
        );

        res.json({
            pendingCount,
            todayCount,
            todayRevenue,
            customerCount
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
