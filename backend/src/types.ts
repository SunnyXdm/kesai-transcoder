/**
 * QualityPreset defines the settings for a specific video quality.
 */
export interface QualityPreset {
    scale: string;
    bitrate: string;
    bandwidth: number;
    resolution: string;
}

/**
 * VideoRecord represents a video entry stored in the database.
 */
export interface VideoRecord {
    id: number;
    storedFile: string;      // The hashed filename used for storage.
    originalName: string;    // The original name as uploaded.
    outputDir: string;
    qualities: string;       // Comma-separated list of allowed or selected quality presets.
    m3u8Url: string | null;
    thumbnailUrl: string | null;
    blurhash: string | null;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
    width: number;
    height: number;
    duration: number;
    createdAt: string;
}

/**
 * Job represents a transcoding task.
 */
export interface Job {
    id: number;
    storedFile: string;
    qualities: string[];  // The selected qualities for transcoding.
    inputFilePath: string;
    outputDir: string;
    duration: number;     // Video duration in seconds.
}

/**
 * ProbeResult represents the result of probing a video file.
 */
export interface ProbeResult {
    width: number;
    height: number;
    duration: number;  // seconds
}
