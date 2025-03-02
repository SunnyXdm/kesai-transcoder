import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app, { registerTranscodeRoutes } from './app';
import { config } from './config/config';
import { initSocketIO } from './services/socketService';
import { resumePendingJobs } from './services/jobProcessor';
import { logger } from './utils/logger';
import fs from 'fs';

// Ensure upload and output directories exist.
[config.uploadDir, config.outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

// Register transcode routes (which require Socket.IO).
registerTranscodeRoutes(io);

// Initialize Socket.IO events.
initSocketIO(io);

// Resume pending jobs from the database on startup.
resumePendingJobs(io);

httpServer.listen(config.port, () => {
    logger.info(`Transcoder service running at http://localhost:${config.port}`);
});
