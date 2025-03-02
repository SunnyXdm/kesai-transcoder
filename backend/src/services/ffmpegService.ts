import { spawn } from 'child_process';
import { logger } from '../utils/logger';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Runs ffmpeg with provided arguments and progress tracking.
 * @param args - ffmpeg arguments.
 * @param jobId - Job identifier.
 * @param quality - Quality preset being processed.
 * @param totalDuration - Total video duration in seconds.
 * @param io - Socket.IO instance for progress updates.
 */
export function runFfmpegWithProgress(args: string[], jobId: number, quality: string, totalDuration: number, io: SocketIOServer): Promise<void> {
    return new Promise((resolve, reject) => {
        logger.info(`Job ${jobId} [${quality}]: Running ffmpeg with args: ${args.join(' ')}`);
        const ffmpeg = spawn('ffmpeg', [...args, '-progress', 'pipe:1']);
        ffmpeg.stdout.setEncoding('utf8');
        ffmpeg.stdout.on('data', (data: string) => {
            data.split('\n').forEach(line => {
                if (line.startsWith('out_time_ms=')) {
                    const outTimeMs = parseInt(line.split('=')[1], 10);
                    const percent = Math.min(100, (outTimeMs / (totalDuration * 1e6)) * 100);
                    io.emit('job-progress', { jobId, quality, progress: percent.toFixed(2) });
                }
            });
        });
        ffmpeg.stderr.on('data', (data) => {
            logger.error(`ffmpeg stderr [Job ${jobId} ${quality}]: ${data}`);
        });
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                io.emit('job-progress', { jobId, quality, progress: '100' });
                resolve();
            } else {
                reject(new Error(`ffmpeg exited with code ${code}`));
            }
        });
    });
}
