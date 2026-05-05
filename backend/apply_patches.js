const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const url = 'mysql://root:ErOrsGBhXaAjwuTDFNsyqbwFLPllAxRj@trolley.proxy.rlwy.net:33713/railway';

async function applyMissingPatches() {
    console.log("Connecting to Railway database...");
    const connection = await mysql.createConnection(url);
    
    try {
        const runSqlFile = async (filename) => {
            console.log(`Running ${filename}...`);
            const sqlPath = path.join(__dirname, '..', filename);
            const sqlString = fs.readFileSync(sqlPath, 'utf8');
            // Remove USE statements because we are connecting directly to railway db
            const cleanedSql = sqlString.replace(/USE supply_sense_db;/g, '');
            const statements = cleanedSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
            
            for (const statement of statements) {
                try {
                    await connection.query(statement);
                } catch (e) {
                    // Ignore duplicate column errors
                    if (!e.message.includes("Duplicate column name")) {
                        console.error(`Error in ${filename}:`, e.message);
                    }
                }
            }
            console.log(`${filename} complete.`);
        };

        await runSqlFile('update_schema.sql');
        await runSqlFile('extra_features.sql');

        console.log("Running migrate_phone.js logic...");
        const queries = [
            "ALTER TABLE users ADD COLUMN phone VARCHAR(15);",
            "ALTER TABLE donations ADD COLUMN donorPhone VARCHAR(15);",
            "ALTER TABLE donation_acceptances ADD COLUMN ngoPhone VARCHAR(15);"
        ];

        for (const query of queries) {
            try {
                await connection.query(query);
            } catch (e) {
                if (!e.message.includes("Duplicate column name")) {
                    console.error("Error adding phone columns:", e.message);
                }
            }
        }
        
        console.log("All missing patches successfully applied to Railway!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.end();
    }
}

applyMissingPatches();
