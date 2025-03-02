import path from 'path';
import { Job, VideoRecord } from '../types';
import { processTranscodingJob } from '../services/transcodingService';
import { Server as SocketIOServer } from 'socket.io';
import db from '../db';
import { UPLOAD_DIR, OUTPUT_DIR } from '../config';
import logger from '../logger';

const jobQueue: Job[] = [];
let processing = false;

/**
 * Enqueues a transcoding job.
 * @param job - The job to enqueue.
 * @param io - Socket.IO server instance.
 */
export function enqueueJob(job: Job, io: SocketIOServer): void {
    jobQueue.push(job);
    processQueue(io).catch(err => logger.error('Queue processing error: %s', err));
}

/**
 * Processes queued jobs sequentially.
 * @param io - Socket.IO server instance.
 */
export async function processQueue(io: SocketIOServer): Promise<void> {
    if (processing) return;
    processing = true;
    while (jobQueue.length > 0) {
        const job = jobQueue.shift() as Job;
        try {
            await processTranscodingJob(job, io);
        } catch (error) {
            logger.error(`Job ${job.id} failed: %s`, error);
            // Optionally, update DB with failure status and notify clients.
        }
    }
    processing = false;
}

/**
 * Resumes pending jobs from the database (for jobs with status 'queued' or 'processing').
 * @param io - Socket.IO server instance.
 */
export function resumePendingJobs(io: SocketIOServer): void {
    try {
        const stmt = db.prepare(`SELECT id, storedFile, originalName, duration, qualities FROM videos WHERE status IN ('queued','processing')`);
        const pendingJobs: VideoRecord[] = stmt.all() as VideoRecord[];
        for (const record of pendingJobs) {
            const job: Job = {
                id: record.id,
                storedFile: record.storedFile,
                qualities: record.qualities.split(','),
                inputFilePath: path.join(UPLOAD_DIR, record.storedFile),
                outputDir: path.join(OUTPUT_DIR, String(record.id)),
                duration: record.duration
            };
            enqueueJob(job, io);
        }
    } catch (error) {
        logger.error('Error resuming pending jobs: %s', error);
    }
}

export { jobQueue };
