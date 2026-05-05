const mysql = require('mysql2/promise');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || 'mysql://root:ErOrsGBhXaAjwuTDFNsyqbwFLPllAxRj@trolley.proxy.rlwy.net:33713/railway';

const pool = mysql.createPool(dbUrl);

module.exports = pool;
