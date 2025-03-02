import fs from 'fs';
import { $ } from 'zx';
import path from 'path';
import logger from '../logger';
import { runFfmpegWithProgress } from '../utils/ffmpeg';
import { computeBlurHash } from '../utils/blurhashUtil';
import { Job } from '../types';
import { Server as SocketIOServer } from 'socket.io';
import { QUALITY_PRESETS } from '../config';

/**
 * Processes a transcoding job.
 * Transcodes the video to each selected quality, generates cover thumbnail, storyboard, WebVTT,
 * and computes the blurhash.
 * @param job - The transcoding job.
 * @param io - Socket.IO server instance.
 */
export async function processTranscodingJob(job: Job, io: SocketIOServer): Promise<void> {
    // Transcode to each selected quality.
    for (const quality of job.qualities) {
        const preset = QUALITY_PRESETS[quality as keyof typeof QUALITY_PRESETS];
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
            logger.error(`Job ${job.id}: Error transcoding quality ${quality}: %s`, error);
            throw error;
        }
    }

    // Create master playlist.
    const masterPlaylistPath = path.join(job.outputDir, 'master.m3u8');
    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n';
    for (const quality of job.qualities) {
        const preset = QUALITY_PRESETS[quality as keyof typeof QUALITY_PRESETS];
        masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${preset.bandwidth},RESOLUTION=${preset.resolution}\n`;
        masterPlaylist += `${quality}.m3u8\n`;
    }
    await fs.promises.writeFile(masterPlaylistPath, masterPlaylist);

    // Generate cover thumbnail at 10% of video duration.
    const thumbnailTime = job.duration * 0.1;
    const coverThumbnailPath = path.join(job.outputDir, 'thumbnail.jpg');
    await $`ffmpeg -y -ss ${thumbnailTime} -i ${job.inputFilePath} -vframes 1 -q:v 2 ${coverThumbnailPath}`;

    // Compute blurhash for the cover thumbnail.
    const blurhashStr = await computeBlurHash(coverThumbnailPath);

    // Generate storyboard image and WebVTT for preview thumbnails.
    const thumbWidth = 180;
    const thumbHeight = 101;
    const interval = 2; // seconds between preview frames
    const numThumbs = Math.floor(job.duration / interval);
    const cols = 8;
    const rows = Math.ceil(numThumbs / cols);
    const storyboardPath = path.join(job.outputDir, 'storyboard.jpg');
    await $`ffmpeg -y -i ${job.inputFilePath} -vf "fps=1/${interval},scale=${thumbWidth}:${thumbHeight},tile=${cols}x${rows}" -frames:v 1 ${storyboardPath}`;

    const vttLines: string[] = ['WEBVTT', ''];
    for (let i = 0; i < numThumbs; i++) {
        const formatTime = (t: number): string => new Date(t * 1000).toISOString().substr(11, 12);
        const startTime = formatTime(i * interval);
        const endTime = formatTime((i + 1) * interval);
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = col * thumbWidth;
        const y = row * thumbHeight;
        vttLines.push(`${startTime} --> ${endTime}`);
        vttLines.push(`storyboard.jpg#xywh=${x},${y},${thumbWidth},${thumbHeight}`);
        vttLines.push('');
    }
    const vttPath = path.join(job.outputDir, 'thumbnails.vtt');
    await fs.promises.writeFile(vttPath, vttLines.join('\n'));
}
