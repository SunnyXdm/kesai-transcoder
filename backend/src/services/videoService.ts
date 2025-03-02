import path from 'path';
import fs from 'fs';
import { computeBlurHash } from '../utils/blurhash';
import { logger } from '../utils/logger';
import { DatabaseService } from './database';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Quality preset configuration.
 */
export interface QualityPreset {
    scale: string;      // e.g., "256:-2"
    bitrate: string;    // e.g., "200k"
    bandwidth: number;  // for master playlist
    resolution: string; // e.g., "256x144"
}

export const qualityPresets: Record<string, QualityPreset> = {
    '144p': { scale: '256:-2', bitrate: '200k', bandwidth: 200000, resolution: '256x144' },
    '240p': { scale: '426:-2', bitrate: '400k', bandwidth: 400000, resolution: '426x240' },
    '360p': { scale: '640:-2', bitrate: '800k', bandwidth: 800000, resolution: '640x360' },
    '480p': { scale: '854:-2', bitrate: '1500k', bandwidth: 1500000, resolution: '854x480' },
    '720p': { scale: '1280:-2', bitrate: '3000k', bandwidth: 3000000, resolution: '1280x720' },
    '1080p': { scale: '1920:-2', bitrate: '6000k', bandwidth: 6000000, resolution: '1920x1080' },
    '1440p': { scale: '2560:-2', bitrate: '12000k', bandwidth: 12000000, resolution: '2560x1440' },
    '2160p': { scale: '3840:-2', bitrate: '24000k', bandwidth: 24000000, resolution: '3840x2160' }
};

/**
 * Video service handling video processing tasks.
 */
export const VideoService = {
    /**
     * Generates a master playlist from transcoded quality files.
     * @param outputDir - Directory containing quality-specific playlists.
     * @param qualities - Selected quality options.
     * @returns Path to the master playlist.
     */
    async generateMasterPlaylist(outputDir: string, qualities: string[]): Promise<string> {
        const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
        let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n';
        qualities.forEach(quality => {
            const preset = qualityPresets[quality];
            masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${preset.bandwidth},RESOLUTION=${preset.resolution}\n`;
            masterPlaylist += `${quality}.m3u8\n`;
        });
        await fs.promises.writeFile(masterPlaylistPath, masterPlaylist);
        return masterPlaylistPath;
    },

    /**
     * Generates a cover thumbnail using ffmpeg at a specified time.
     * @param inputFilePath - Path to the input video.
     * @param outputDir - Directory to save the thumbnail.
     * @param duration - Total duration of the video.
     * @returns Path to the cover thumbnail.
     */
    async generateCoverThumbnail(inputFilePath: string, outputDir: string, duration: number): Promise<string> {
        const thumbnailTime = duration * 0.1;
        const coverThumbnailPath = path.join(outputDir, 'thumbnail.jpg');
        const { $ } = await import('zx');
        await $`ffmpeg -y -ss ${thumbnailTime} -i ${inputFilePath} -vframes 1 -q:v 2 ${coverThumbnailPath}`;
        return coverThumbnailPath;
    },

    /**
     * Generates storyboard image and WebVTT file for video previews.
     * @param inputFilePath - Path to the input video.
     * @param outputDir - Directory to save storyboard and VTT.
     * @param duration - Total video duration.
     */
    async generateStoryboard(inputFilePath: string, outputDir: string, duration: number): Promise<void> {
        const thumbWidth = 180;
        const thumbHeight = 101;
        const interval = 2; // seconds
        const numThumbs = Math.floor(duration / interval);
        const cols = 8;
        const rows = Math.ceil(numThumbs / cols);
        const storyboardPath = path.join(outputDir, 'storyboard.jpg');
        const { $ } = await import('zx');
        await $`ffmpeg -y -i ${inputFilePath} -vf "fps=1/${interval},scale=${thumbWidth}:${thumbHeight},tile=${cols}x${rows}" -frames:v 1 ${storyboardPath}`;

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
        const vttPath = path.join(outputDir, 'thumbnails.vtt');
        await fs.promises.writeFile(vttPath, vttLines.join('\n'));
    }
};
