import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'videos.db');
const db = new Database(dbPath);
export default (db as unknown) as import('better-sqlite3').Database;
