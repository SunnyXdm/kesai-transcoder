import path from 'path';
import fs from 'fs';
import { VideoService, qualityPresets } from './videoService';
import { runFfmpegWithProgress } from './ffmpegService';
import { computeBlurHash } from '../utils/blurhash';
import { DatabaseService } from './database';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
import { broadcastVideoUpdate } from './socketService';

export interface Job {
    id: number;
    storedFile: string;
    qualities: string[];
    inputFilePath: string;
    outputDir: string;
    duration: number;
}

const jobQueue: Job[] = [];
let processing = false;

/**
 * Processes a single job: transcoding, thumbnail generation, storyboard creation, and blurhash computation.
 * @param job - Job to be processed.
 * @param io - Socket.IO instance.
 */
export async function processJob(job: Job, io: SocketIOServer): Promise<void> {
    // Transcode each selected quality.
    for (const quality of job.qualities) {
        const preset = qualityPresets[quality];
        const outputFile = path.join(job.outputDir, `${quality}.m3u8`);
        const ffmpegArgs = [
            '-y',
            '-i', job.inputFilePath,
            '-reset_timestamps', '1',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-b:v', preset.bitrate,
            '-vf', `scale=${preset.scale}`,
            '-c:a', 'aac',
            '-f', 'hls',
            '-hls_time', '10',
            '-hls_playlist_type', 'vod',
            outputFile
        ];
        try {
            logger.info(`Job ${job.id}: Transcoding quality ${quality}...`);
            await runFfmpegWithProgress(ffmpegArgs, job.id, quality, job.duration, io);
            logger.info(`Job ${job.id}: Completed quality ${quality}.`);
        } catch (error) {
            logger.error(`Job ${job.id}: Error transcoding quality ${quality}:`, error);
            throw error;
        }
    }

    // Create master playlist.
    await VideoService.generateMasterPlaylist(job.outputDir, job.qualities);

    // Generate cover thumbnail.
    const coverThumbnailPath = await VideoService.generateCoverThumbnail(job.inputFilePath, job.outputDir, job.duration);

    // Compute blurhash for cover thumbnail.
    const blurhashStr = await computeBlurHash(coverThumbnailPath);

    // Generate storyboard and VTT.
    await VideoService.generateStoryboard(job.inputFilePath, job.outputDir, job.duration);

    // Update database record.
    const m3u8Url = `/outputs/${job.id}/master.m3u8`;
    const thumbnailUrl = `/outputs/${job.id}/thumbnail.jpg`;
    DatabaseService.updateVideo(job.id, {
        outputDir: job.outputDir,
        m3u8Url,
        thumbnailUrl,
        blurhash: blurhashStr,
        status: 'completed'
    });
    io.emit('job-complete', { jobId: job.id, m3u8Url, thumbnailUrl });

    // Broadcast the updated video list.
    broadcastVideoUpdate();

    logger.info(`Job ${job.id} processing completed.`);
}

/**
 * Processes the job queue sequentially.
 * @param io - Socket.IO instance.
 */
export async function processQueue(io: SocketIOServer): Promise<void> {
    if (processing) return;
    processing = true;
    while (jobQueue.length > 0) {
        const job = jobQueue.shift() as Job;
        DatabaseService.updateVideo(job.id, { status: 'processing' });
        io.emit('video-updated', DatabaseService.getVideoById(job.id));
        try {
            await processJob(job, io);
        } catch (error) {
            logger.error(`Job ${job.id} failed:`, error);
            DatabaseService.updateVideo(job.id, { status: 'failed' });
            io.emit('job-failed', { jobId: job.id, error: (error as Error).message });
            // Broadcast update after failure.
            broadcastVideoUpdate();
        }
    }
    processing = false;
}

/**
 * Adds a job to the processing queue.
 * @param job - Job to be added.
 * @param io - Socket.IO instance.
 */
export function addJob(job: Job, io: SocketIOServer): void {
    jobQueue.push(job);
    processQueue(io).catch(err => logger.error('Error processing job queue:', err));
}

/**
 * Resumes pending jobs from the database on startup.
 * @param io - Socket.IO instance.
 */
export function resumePendingJobs(io: SocketIOServer): void {
    const pendingVideos = DatabaseService.getPendingJobs();
    pendingVideos.forEach(record => {
        const job = {
            id: record.id!,
            storedFile: record.storedFile,
            qualities: record.qualities.split(','),
            inputFilePath: record.storedFile ? require('path').join(require('../config/config').config.uploadDir, record.storedFile) : '',
            outputDir: require('path').join(require('../config/config').config.outputDir, String(record.id)),
            duration: record.duration
        };
        // Ensure output directory exists.
        if (!fs.existsSync(job.outputDir)) {
            fs.mkdirSync(job.outputDir, { recursive: true });
        }
        addJob(job, io);
    });
}
