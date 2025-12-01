const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');
const db = require('./database/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        // Wait for DB initialization to complete (fallback logic is async)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check which DB type is active
        const isPostgres = db.dbType === 'postgres';
        const schemaFile = isPostgres ? 'schema.sql' : 'schema.sqlite.sql';
        console.log(`Using schema file: ${schemaFile} for ${db.dbType}`);

        const schemaPath = path.join(__dirname, 'database', schemaFile);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // For SQLite, we might need to split statements if the driver doesn't support multiple
        if (!isPostgres) {
            const statements = schemaSql.split(';').filter(stmt => stmt.trim());
            for (const stmt of statements) {
                await db.query(stmt);
            }
        } else {
            await db.query(schemaSql);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
