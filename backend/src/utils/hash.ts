import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/config';
import { logger } from './logger';

/**
 * Computes SHA-256 hash for a given file using streaming and renames it to the hash value.
 * @param filePath - Path to the uploaded file.
 * @param originalName - Original filename.
 * @returns Hashed filename.
 */
export async function hashAndRenameFile(filePath: string, originalName: string): Promise<string> {
    try {
        const hash = crypto.createHash('sha256');
        const fileStream = fs.createReadStream(filePath);

        await new Promise<void>((resolve, reject) => {
            fileStream.on('data', (data) => hash.update(data));
            fileStream.on('error', (err) => reject(err));
            fileStream.on('end', () => resolve());
        });

        const digest = hash.digest('hex');
        const ext = path.extname(originalName);
        const newFilename = `${digest}${ext}`;
        const newFilePath = path.join(config.uploadDir, newFilename);

        if (!fs.existsSync(newFilePath)) {
            await fs.promises.rename(filePath, newFilePath);
        } else {
            await fs.promises.unlink(filePath);
        }
        logger.info(`File hashed and renamed to ${newFilename}`);
        return newFilename;
    } catch (error) {
        logger.error('Error in hashAndRenameFile:', error);
        throw error;
    }
}
