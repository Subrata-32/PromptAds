const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'promptads.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    name        TEXT     NOT NULL,
    email       TEXT     NOT NULL,
    company     TEXT     NOT NULL,
    budget      TEXT,
    goal        TEXT,
    ip_address  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ Database initialized at:', DB_PATH);

module.exports = db;
