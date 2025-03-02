import { Router } from 'express';
import multer from 'multer';
import { uploadVideo, transcodeVideo, getVideos } from '../controllers/videoController';

const router: Router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('video'), uploadVideo);
router.post('/transcode', transcodeVideo);
router.get('/videos', getVideos);

export default router;
