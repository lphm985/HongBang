const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'https://hongbang.onrender.com', 
    port: 3306,
    user: 'lphm985', 
    password: 'Lphm123',
    database: 'hong_bang',
    connectionLimit: 20,
    idleTimeout: 120000, 
    acquireTimeout: 120000,
    // Trả về các số lớn (BIGINT) dưới dạng chuỗi để tránh lỗi JSON serialization
    supportBigNumbers: true,
    bigNumberStrings: true,
});

module.exports = pool;
