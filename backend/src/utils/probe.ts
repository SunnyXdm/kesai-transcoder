import { $ } from 'zx';
import logger from '../logger';
import { ProbeResult } from '../types';

/**
 * Probes a video file using ffprobe with robust parameters.
 * @param filePath - Path to the video file.
 * @returns A ProbeResult with width, height, and duration.
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
        logger.error('ffprobe error: %s', error);
        throw new Error('Failed to probe video file');
    }
}
