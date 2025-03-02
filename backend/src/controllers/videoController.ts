import { Request, Response } from 'express';
import path from 'path';
import { config } from '../config/config';
import { hashAndRenameFile } from '../utils/hash';
import { probeVideo } from '../utils/probe';
import { DatabaseService } from '../services/database';
import { logger } from '../utils/logger';
import { broadcastVideoUpdate } from '../services/socketService';

/**
 * Handles video upload and analysis.
 */
export async function uploadVideo(req: Request, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No video file uploaded' });
            return;
        }
        const originalPath = path.join(config.uploadDir, req.file.filename);
        // Compute hash and rename file.
        const newFilename = await hashAndRenameFile(originalPath, req.file.originalname);
        const inputFilePath = path.join(config.uploadDir, newFilename);
        const probe = await probeVideo(inputFilePath);
        // Determine allowed qualities based on video width.
        const allowedQualities = Object.keys(require('../services/videoService').qualityPresets).filter(q => {
            const [presetWidthStr] = require('../services/videoService').qualityPresets[q].resolution.split('x');
            const presetWidth = parseInt(presetWidthStr, 10);
            return presetWidth <= probe.width;
        });
        const videoRecord = {
            storedFile: newFilename,
            originalName: req.file.originalname,
            qualities: allowedQualities.join(','),
            status: 'pending',
            width: probe.width,
            height: probe.height,
            duration: probe.duration
        };
        const fileId = DatabaseService.insertVideo(videoRecord);
        const newVideo = DatabaseService.getVideoById(fileId);
        // Broadcast the new video update to all connected clients.
        broadcastVideoUpdate();
        res.json({ fileId, width: probe.width, height: probe.height, duration: probe.duration, allowedQualities });
    } catch (err) {
        logger.error('Upload error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
}

export async function getVideos(req: Request, res: Response): Promise<void> {
    try {
        // const stmt = db.prepare(`
        //     SELECT id, storedFile, originalName, qualities, m3u8Url, thumbnailUrl, blurhash, status, createdAt
        //     FROM videos ORDER BY createdAt DESC
        //   `);
        // const rows = stmt.all();
        const rows = DatabaseService.getAllVideos();
        res.json(rows);
    } catch (err) {
        console.error('Videos endpoint error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
}