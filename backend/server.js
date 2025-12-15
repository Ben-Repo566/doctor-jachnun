const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const ordersRoutes = require('./routes/orders');
const customersRoutes = require('./routes/customers');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Doctor Jachnun API is running' });
});

// Start server
async function startServer() {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
        console.log('⚠️  Starting without database - some features may not work');
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📋 API endpoints:`);
        console.log(`   - GET  /api/health`);
        console.log(`   - POST /api/auth/login`);
        console.log(`   - GET  /api/orders`);
        console.log(`   - POST /api/orders`);
        console.log(`   - GET  /api/customers`);
    });
}

startServer();
