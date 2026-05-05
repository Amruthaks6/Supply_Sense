const mysql = require('mysql2/promise');

const url = 'mysql://root:ErOrsGBhXaAjwuTDFNsyqbwFLPllAxRj@trolley.proxy.rlwy.net:33713/railway';

async function applyMissingPatches() {
    console.log("Connecting to Railway database...");
    const connection = await mysql.createConnection(url);
    
    try {
        const queries = [
            // from update_schema.sql
            "ALTER TABLE donations ADD COLUMN totalQuantity INT NOT NULL DEFAULT 0",
            "ALTER TABLE donations ADD COLUMN acceptedQuantity INT NOT NULL DEFAULT 0",
            "ALTER TABLE donations ADD COLUMN remainingQuantity INT NOT NULL DEFAULT 0",
            "ALTER TABLE donations ADD COLUMN acceptedBy JSON DEFAULT NULL",
            "ALTER TABLE donations ADD COLUMN estimatedDeliveryTime DATETIME DEFAULT NULL",
            "ALTER TABLE donations MODIFY COLUMN status ENUM('Pending', 'Accepted', 'Under Process', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Pending'",
            `CREATE TABLE IF NOT EXISTS donation_acceptances (
                id INT AUTO_INCREMENT PRIMARY KEY,
                donationId INT NOT NULL,
                ngoName VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                status ENUM('Accepted', 'Under Process', 'In Transit', 'Delivered') DEFAULT 'Accepted',
                acceptedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (donationId) REFERENCES donations(id) ON DELETE CASCADE
            )`,
            // from extra_features.sql
            "ALTER TABLE users ADD COLUMN city VARCHAR(100)",
            "ALTER TABLE ngo_profiles ADD COLUMN city VARCHAR(100)",
            "ALTER TABLE ngo_profiles ADD COLUMN phone VARCHAR(20)",
            "ALTER TABLE donations ADD COLUMN city VARCHAR(100)",
            "ALTER TABLE donations ADD COLUMN donorPhone VARCHAR(20)",
            `CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT NOT NULL,
                message TEXT NOT NULL,
                type ENUM('Info', 'Success', 'Warning') DEFAULT 'Info',
                isRead BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )`,
            "ALTER TABLE donation_acceptances ADD COLUMN certificateId VARCHAR(100)",
            "ALTER TABLE donation_acceptances ADD COLUMN certificateIssuedAt TIMESTAMP NULL",
            
            // from migrate_phone.js
            "ALTER TABLE users ADD COLUMN phone VARCHAR(15)",
            "ALTER TABLE donation_acceptances ADD COLUMN ngoPhone VARCHAR(15)"
        ];

        for (const query of queries) {
            try {
                await connection.query(query);
                console.log("Success:", query.split(' ').slice(0, 4).join(' '));
            } catch (e) {
                if (!e.message.includes("Duplicate column name") && !e.message.includes("already exists")) {
                    console.error("Error running query:", e.message);
                } else {
                    console.log("Column already exists, skipping...");
                }
            }
        }
        
        console.log("All patches applied to Railway!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.end();
    }
}

applyMissingPatches();
