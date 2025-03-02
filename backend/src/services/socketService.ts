import { Server as SocketIOServer } from 'socket.io';
import { DatabaseService } from './database';
import { logger } from '../utils/logger';

let ioInstance: SocketIOServer | null = null;

/**
 * Sets the Socket.IO instance for use in broadcasting updates.
 * @param io - Socket.IO server instance.
 */
export function setSocketIO(io: SocketIOServer): void {
    ioInstance = io;
}

/**
 * Broadcasts the updated video list to all connected clients.
 */
export function broadcastVideoUpdate(): void {
    if (!ioInstance) {
        logger.error('Socket.IO instance not set.');
        return;
    }
    const videos = DatabaseService.getAllVideos();
    ioInstance.emit('video-list', videos);
}

/**
 * Initializes Socket.IO events and handlers.
 * @param io - Socket.IO server instance.
 */
export function initSocketIO(io: SocketIOServer): void {
    ioInstance = io;
    io.on('connection', socket => {
        logger.info(`Client connected: ${socket.id}`);
        const videos = DatabaseService.getAllVideos();
        socket.emit('video-list', videos);
        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });
}
