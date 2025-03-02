import Database from 'better-sqlite3';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { Video } from '../models/Video';

export const db = new Database(config.dbPath) as import('better-sqlite3').Database;

// Initialize the database schema.
db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    storedFile TEXT,
    originalName TEXT,
    outputDir TEXT,
    qualities TEXT,
    m3u8Url TEXT,
    thumbnailUrl TEXT,
    blurhash TEXT,
    status TEXT,
    width INTEGER,
    height INTEGER,
    duration REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export const DatabaseService = {
    /**
     * Inserts a new video record into the database.
     * @param video - Video data.
     * @returns Inserted record id.
     */
    insertVideo(video: Video): number {
        const stmt = db.prepare(`
      INSERT INTO videos (storedFile, originalName, qualities, status, width, height, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(video.storedFile, video.originalName, video.qualities, video.status, video.width, video.height, video.duration);
        return result.lastInsertRowid as number;
    },

    /**
     * Updates a video record in the database.
     * @param id - Video record id.
     * @param updates - Object containing fields to update.
     */
    updateVideo(id: number, updates: Partial<Video>): void {
        const fields = Object.keys(updates);
        if (fields.length === 0) return;
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => (updates as any)[field]);
        const stmt = db.prepare(`UPDATE videos SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
    },

    /**
     * Retrieves a video record by id.
     * @param id - Video record id.
     * @returns Video record.
     */
    getVideoById(id: number): Video | undefined {
        const stmt = db.prepare(`SELECT * FROM videos WHERE id = ?`);
        return stmt.get(id) as Video | undefined;
    },

    /**
     * Retrieves all video records.
     * @returns Array of video records.
     */
    getAllVideos(): Video[] {
        const stmt = db.prepare(`SELECT * FROM videos ORDER BY createdAt DESC`);
        return stmt.all() as Video[];
    },

    /**
     * Retrieves pending jobs.
     * @returns Array of video records with status queued or processing.
     */
    getPendingJobs(): Video[] {
        const stmt = db.prepare(`SELECT * FROM videos WHERE status IN ('queued','processing')`);
        return stmt.all() as Video[];
    }
};
