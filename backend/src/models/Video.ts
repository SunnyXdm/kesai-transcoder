/**
 * Represents a video record in the database.
 */
export interface Video {
    id?: number;
    storedFile: string;
    originalName: string;
    outputDir?: string;
    qualities: string;
    m3u8Url?: string;
    thumbnailUrl?: string;
    blurhash?: string;
    status: string;
    width: number;
    height: number;
    duration: number;
    createdAt?: string;
}
