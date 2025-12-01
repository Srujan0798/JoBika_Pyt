const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database/local.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- Users Table Schema ---");
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });

    console.log("\n--- Users Table Content ---");
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
    });
});

db.close();
