import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';
import { DatabaseService } from '../services/database';
import { addJob } from '../services/jobProcessor';
import { logger } from '../utils/logger';

/**
 * Handles transcoding request.
 */
export function transcodeVideo(io: any) {
    return (req: Request, res: Response): void => {
        try {
            const { fileId, qualities } = req.body;
            if (!fileId || !qualities || !Array.isArray(qualities) || qualities.length === 0) {
                res.status(400).json({ error: 'Invalid request, missing fileId or qualities' });
                return;
            }
            const record = DatabaseService.getVideoById(fileId);
            if (!record) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            const available = record.qualities.split(',');
            // Filter valid qualities.
            const selectedQualities = qualities.filter((q: string) => available.includes(q));
            if (selectedQualities.length === 0) {
                res.status(400).json({ error: 'No valid quality options selected' });
                return;
            }
            DatabaseService.updateVideo(fileId, { qualities: selectedQualities.join(','), status: 'queued' });
            const videoOutputDir = path.join(config.outputDir, String(fileId));
            if (!fs.existsSync(videoOutputDir)) {
                fs.mkdirSync(videoOutputDir, { recursive: true });
            }
            const job = {
                id: fileId,
                storedFile: record.storedFile,
                qualities: selectedQualities,
                inputFilePath: path.join(config.uploadDir, record.storedFile),
                outputDir: videoOutputDir,
                duration: record.duration
            };
            addJob(job, io);
            res.json({ jobId: fileId });
        } catch (err) {
            logger.error('Transcode error:', err);
            res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
        }
    }
}
