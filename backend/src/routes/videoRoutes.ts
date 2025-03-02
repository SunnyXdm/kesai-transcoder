import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { config } from '../config/config';
import { uploadVideo, getVideos } from '../controllers/videoController';
import { db } from '../services/database';

const router: Router = Router();

// Setup multer storage.
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.uploadDir),
    filename: (_req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

router.post('/upload', upload.single('video'), uploadVideo);
router.get('/videos', getVideos);

export default router;
