import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { config } from './config/config';
import videoRoutes from './routes/videoRoutes';
import createTranscodeRouter from './routes/transcodeRoutes';

const app: express.Application = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve static files for outputs.
// app.use('/outputs', express.static(config.outputDir));

// Register video routes.
app.use('/api', videoRoutes);

/**
 * Registers transcode routes with the provided Socket.IO instance.
 * @param io - Socket.IO instance.
 */
export function registerTranscodeRoutes(io: any): void {
    app.use('/api', createTranscodeRouter(io));
}

export default app;
