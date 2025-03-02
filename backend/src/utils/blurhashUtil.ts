import fs from 'fs';
import sharp from 'sharp';
import { encode } from 'blurhash';
import logger from '../logger';

/**
 * Computes a blurhash string from an image file.
 * @param imagePath - Path to the image file.
 * @returns A blurhash string.
 */
export async function computeBlurHash(imagePath: string): Promise<string> {
    try {
        const imageBuffer = await fs.promises.readFile(imagePath);
        const { data, info } = await sharp(imageBuffer)
            .raw()
            .ensureAlpha()
            .resize(32, 32, { fit: 'inside' })
            .toBuffer({ resolveWithObject: true });
        return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
    } catch (error) {
        logger.error('Error computing blurhash: %s', error);
        return '';
    }
}
