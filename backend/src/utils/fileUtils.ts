import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UPLOAD_DIR } from '../config';
import logger from '../logger';

/**
 * Computes SHA-256 hash of a file and renames it to the hash plus its original extension.
 * If a file with the hashed name already exists, the duplicate is removed.
 * @param filePath - Path to the temporary uploaded file.
 * @param originalName - Original filename.
 * @returns The new (hashed) filename.
 */
export async function hashAndRenameFile(filePath: string, originalName: string): Promise<string> {
    try {
        const fileBuffer = await fs.promises.readFile(filePath);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const ext = path.extname(originalName);
        const newFilename = `${hash}${ext}`;
        const newFilePath = path.join(UPLOAD_DIR, newFilename);
        if (!fs.existsSync(newFilePath)) {
            await fs.promises.rename(filePath, newFilePath);
            logger.info(`File renamed to ${newFilename}`);
        } else {
            await fs.promises.unlink(filePath);
            logger.info('Duplicate file detected; removed temporary file.');
        }
        return newFilename;
    } catch (error) {
        logger.error('Error in hashAndRenameFile: %s', error);
        throw error;
    }
}
