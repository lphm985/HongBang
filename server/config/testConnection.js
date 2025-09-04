const pool = require('./database'); // file pool.js

async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('Kết nối DB thành công!');
        conn.release();
    } catch (err) {
        console.error('Lỗi kết nối DB:', err);
    }
}

testConnection();
