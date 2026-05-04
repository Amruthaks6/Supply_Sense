const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const pool = require('./backend/db');
const fs = require('fs');

async function runSQL() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'extra_features.sql'), 'utf8');
        const commands = sql.split(';').filter(cmd => cmd.trim() !== '');
        
        for (let cmd of commands) {
            console.log('Executing:', cmd.substring(0, 50) + '...');
            await pool.query(cmd);
        }
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runSQL();
