const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool - supports Railway's MYSQL_URL or individual env vars
let pool;

if (process.env.MYSQL_URL) {
    // Railway provides MYSQL_URL
    pool = mysql.createPool(process.env.MYSQL_URL);
} else {
    // Local development with individual env vars
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'doctor_jachnun',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

// Test connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        return false;
    }
}

module.exports = { pool, testConnection };
