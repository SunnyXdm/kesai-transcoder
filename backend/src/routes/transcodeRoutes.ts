import { Router } from 'express';
import { transcodeVideo } from '../controllers/transcodeController';
import { Server as SocketIOServer } from 'socket.io';

const router: Router = Router();

/**
 * Returns a router for the transcode endpoints.
 * @param io - Socket.IO instance.
 */
export default function createTranscodeRouter(io: SocketIOServer) {
    router.post('/transcode', transcodeVideo(io));
    return router;
}
