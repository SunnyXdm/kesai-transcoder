# Kesai Transcoder

Kesai Transcoder is a video transcoding backend built with Node.js and TypeScript. It handles video uploads, probes files with ffprobe, transcodes videos into multiple quality presets, generates thumbnails and storyboards (with WebVTT previews), and sends real-time updates via Socket.IO.

## Prerequisites

- Node.js (v14+)
- pnpm (or npm/yarn)
- ffmpeg/ffprobe (must be installed and in PATH)
- Docker (if using Docker Compose)

## Running Locally

1. **Clone the repository and install dependencies:**

   ```bash
   git clone https://github.com/sunnyxdm/kesai-transcoder.git
   cd kesai-transcoder/backend
   pnpm install
   cd ../frontend
   pnpm install
   ```


2. **Start the server:**

   For development:
   ```bash
   cd backend
   pnpm run dev
   ```
   (The server listens on port 3000 by default.)

2. **Start the frontend:**

   For development:
   ```bash
   cd backend
   pnpm run dev
   ```

## Running with Docker Compose

To build and run the entire stack, simply execute:

```bash
docker-compose up --build
```

Then access the application at: [http://localhost:4000](http://localhost:4000)

## API Endpoints

- **POST `/api/upload`**  
  Upload a video file. The backend renames the file using a SHA‑256 hash, probes it for metadata, and returns allowed quality presets.

- **GET `/api/videos`**  
  Retrieves a list of videos with their current status and processing outputs.

- **POST `/api/transcode`**  
  Initiates transcoding for a given video by specifying its ID and the desired quality presets. Real-time progress updates are sent via Socket.IO.

- **Static Files:**  
  Transcoded outputs (e.g. thumbnails, playlists) are served from the `/outputs` endpoint.

## How It Works

- **File Handling:**  
  Uploaded files are renamed using a SHA‑256 hash (to avoid duplicates) while storing the original filename for display.

- **Video Processing:**  
  The backend probes each video with ffprobe, enqueues transcoding jobs, generates thumbnails, storyboards, and preview files.

- **Real-Time Updates:**  
  Socket.IO sends live progress updates to clients on the default `/socket.io` endpoint (proxied by nginx as configured).

- **Job Resumption:**  
  On startup, any pending jobs (status "queued" or "processing") are automatically resumed.