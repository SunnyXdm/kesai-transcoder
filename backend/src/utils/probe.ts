import { $ } from 'zx';
import { logger } from './logger';

/**
 * Result from probing a video file.
 */
export interface ProbeResult {
    width: number;
    height: number;
    duration: number;
}

/**
 * Probes a video file using ffprobe to extract metadata.
 * @param filePath - Path to the video file.
 * @returns ProbeResult containing width, height, and duration.
 */
export async function probeVideo(filePath: string): Promise<ProbeResult> {
    try {
        const { stdout } = await $`ffprobe -v error -analyzeduration 100M -probesize 100M -print_format json -show_format -show_streams ${filePath}`;
        const probe = JSON.parse(stdout);
        if (!probe.streams || probe.streams.length === 0) {
            throw new Error('No video streams found');
        }
        const stream = probe.streams.find((s: any) => s.codec_type === 'video');
        if (!stream) {
            throw new Error('No video stream found');
        }
        const width = parseInt(stream.width, 10);
        const height = parseInt(stream.height, 10);
        const duration = parseFloat(probe.format.duration);
        return { width, height, duration };
    } catch (error) {
        logger.error('Error in probeVideo:', error);
        throw new Error('Failed to probe video file');
    }
}
