"use strict";

const Database = require('better-sqlite3')

const db = new Database('log.db')

const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get();
if(row === undefined) {
    console.log('Log database appears to be empty. Creating log database...')

    const sqlInit = `
        CREATE TABLE accesslog ( 
            id INTEGER PRIMARY KEY,
            remoteaddr TEXT,
            remoteuser TEXT,
            time TEXT,
            method TEXT,
            url TEXT,
            protocol TEXT,
            httpversion TEXT,
            secure TEXT,
            status TEXT,
            referer TEXT,
            useragent TEXT);
        `;
    db.exec(sqlInit)
} else {
    console.log('User database exists.')
}

module.exports = db