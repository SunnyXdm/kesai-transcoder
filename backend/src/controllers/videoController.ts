import { Request, Response } from 'express';
import path from 'path';
import db from '../db';
import logger from '../logger';
import { probeVideo } from '../utils/probe';
import { hashAndRenameFile } from '../utils/fileUtils';
import { UPLOAD_DIR, OUTPUT_DIR, QUALITY_PRESETS } from '../config';
import { enqueueJob, processQueue, resumePendingJobs } from '../jobs/jobQueue';
import { Job } from '../types';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';

/**
 * Uploads a video, probes it, renames the file using its hash,
 * and inserts a record into the database.
 */
export async function uploadVideo(req: Request, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No video file uploaded' });
            return;
        }
        const originalPath = path.join(UPLOAD_DIR, req.file.filename);
        const newFilename = await hashAndRenameFile(originalPath, req.file.originalname);
        const inputFilePath = path.join(UPLOAD_DIR, newFilename);
        const probe = await probeVideo(inputFilePath);
        const allowedQualities = Object.keys(QUALITY_PRESETS).filter(q => {
            const [presetWidthStr] = QUALITY_PRESETS[q as keyof typeof QUALITY_PRESETS].resolution.split('x');
            const presetWidth = parseInt(presetWidthStr, 10);
            return presetWidth <= probe.width;
        });
        const stmt = db.prepare(`
      INSERT INTO videos (storedFile, originalName, qualities, status, width, height, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(newFilename, req.file.originalname, allowedQualities.join(','), 'pending', probe.width, probe.height, probe.duration);
        const fileId = result.lastInsertRowid as number;
        const newVideo = db.prepare(`
      SELECT id, storedFile, originalName, qualities, m3u8Url, thumbnailUrl, blurhash, status, createdAt
      FROM videos WHERE id = ?
    `).get(fileId);
        req.app.get('io').emit('video-added', newVideo);
        res.json({ fileId, width: probe.width, height: probe.height, duration: probe.duration, allowedQualities });
    } catch (error) {
        logger.error('Upload error: %s', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}

/**
 * Starts transcoding for a video.
 * Updates the video record to store the actual selected quality presets.
 * Enqueues the transcoding job.
 */
export async function transcodeVideo(req: Request, res: Response): Promise<void> {
    try {
        const { fileId, qualities } = req.body;
        if (!fileId || !qualities || !Array.isArray(qualities) || qualities.length === 0) {
            res.status(400).json({ error: 'Invalid request, missing fileId or qualities' });
            return;
        }
        const record = db.prepare(`SELECT storedFile, duration, qualities FROM videos WHERE id = ?`).get(fileId) as { storedFile: string, duration: number, qualities: string };
        if (!record) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        const available = record.qualities.split(',');
        const selected = qualities.filter((q: string) => available.includes(q));
        if (selected.length === 0) {
            res.status(400).json({ error: 'No valid quality options selected' });
            return;
        }
        // Update the database record with the selected qualities.
        db.prepare(`UPDATE videos SET qualities = ?, status = ? WHERE id = ?`).run(selected.join(','), 'queued', fileId);
        const videoOutputDir = path.join(OUTPUT_DIR, String(fileId));
        if (!fs.existsSync(videoOutputDir)) fs.mkdirSync(videoOutputDir);
        const job: Job = {
            id: fileId,
            storedFile: record.storedFile,
            qualities: selected,
            inputFilePath: path.join(UPLOAD_DIR, record.storedFile),
            outputDir: videoOutputDir,
            duration: record.duration
        };
        const io: SocketIOServer = req.app.get('io');
        enqueueJob(job, io);
        res.json({ jobId: fileId });
    } catch (error) {
        logger.error('Transcode error: %s', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}

/**
 * Retrieves the list of videos.
 */
export function getVideos(_req: Request, res: Response): void {
    try {
        const rows = db.prepare(`
      SELECT id, storedFile, originalName, qualities, m3u8Url, thumbnailUrl, blurhash, status, createdAt
      FROM videos ORDER BY createdAt DESC
    `).all();
        res.json(rows);
    } catch (error) {
        logger.error('Error fetching videos: %s', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
