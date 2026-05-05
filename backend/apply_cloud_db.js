const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const url = 'mysql://root:ErOrsGBhXaAjwuTDFNsyqbwFLPllAxRj@trolley.proxy.rlwy.net:33713/railway';

async function migrate() {
    console.log("Connecting to Railway database...");
    const connection = await mysql.createConnection(url);
    
    try {
        const sqlPath = path.join(__dirname, '../MASTER_SETUP.sql');
        const sqlString = fs.readFileSync(sqlPath, 'utf8');
        const statements = sqlString.split(';').map(s => s.trim()).filter(s => s.length > 0);
        
        console.log("Running MASTER_SETUP.sql...");
        for (const statement of statements) {
            await connection.query(statement);
        }
        console.log("MASTER_SETUP.sql complete.");

        console.log("Running updates (notifications & messages alteration)...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'Info',
                isRead TINYINT(1) DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Notifications table created.');

        try {
             await connection.query("ALTER TABLE messages MODIFY donationId INT NULL");
             console.log('Messages table altered.');
        } catch(e) {
             console.log("Alter messages table error (might already be NULL):", e.message);
        }

        console.log("All migrations successfully applied to Railway!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.end();
    }
}

migrate();
