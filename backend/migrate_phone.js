const pool = require('./db');

async function migrate() {
    try {
        console.log('Starting migration...');
        await pool.query("ALTER TABLE users ADD COLUMN phone VARCHAR(15);");
        console.log('Added phone to users');
    } catch (e) {
        console.log('Note: phone might already exist in users');
    }

    try {
        await pool.query("ALTER TABLE donations ADD COLUMN donorPhone VARCHAR(15);");
        console.log('Added donorPhone to donations');
    } catch (e) {
        console.log('Note: donorPhone might already exist in donations');
    }

    try {
        await pool.query("ALTER TABLE donation_acceptances ADD COLUMN ngoPhone VARCHAR(15);");
        console.log('Added ngoPhone to donation_acceptances');
    } catch (e) {
        console.log('Note: ngoPhone might already exist in donation_acceptances');
    }

    console.log('Migration finished');
    process.exit(0);
}

migrate();
