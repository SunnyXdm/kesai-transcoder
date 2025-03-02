export const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const UPLOAD_DIR: string = process.env.UPLOAD_DIR || 'uploads';
export const OUTPUT_DIR: string = process.env.OUTPUT_DIR || 'outputs';

// Quality presets for transcoding.
export const QUALITY_PRESETS = {
    '144p': { scale: '256:-2', bitrate: '200k', bandwidth: 200000, resolution: '256x144' },
    '240p': { scale: '426:-2', bitrate: '400k', bandwidth: 400000, resolution: '426x240' },
    '360p': { scale: '640:-2', bitrate: '800k', bandwidth: 800000, resolution: '640x360' },
    '480p': { scale: '854:-2', bitrate: '1500k', bandwidth: 1500000, resolution: '854x480' },
    '720p': { scale: '1280:-2', bitrate: '3000k', bandwidth: 3000000, resolution: '1280x720' },
    '1080p': { scale: '1920:-2', bitrate: '6000k', bandwidth: 6000000, resolution: '1920x1080' },
    '1440p': { scale: '2560:-2', bitrate: '12000k', bandwidth: 12000000, resolution: '2560x1440' },
    '2160p': { scale: '3840:-2', bitrate: '24000k', bandwidth: 24000000, resolution: '3840x2160' }
};
