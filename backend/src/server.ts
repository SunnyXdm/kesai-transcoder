// src/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import videoRoutes from './routes/videoRoutes';
import { PORT, OUTPUT_DIR } from './config';
import { resumePendingJobs } from './jobs/jobQueue';
import logger from './logger';

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api', videoRoutes);
app.use('/outputs', express.static(path.join(__dirname, OUTPUT_DIR)));

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
app.set('io', io);

io.on('connection', (socket) => {
    logger.info('Client connected: %s', socket.id);
    socket.on('disconnect', () => {
        logger.info('Client disconnected: %s', socket.id);
    });
});

// Resume any pending jobs from previous runs.
resumePendingJobs(io);

httpServer.listen(PORT, () => {
    logger.info(`Transcoder service running at http://localhost:${PORT}`);
});
