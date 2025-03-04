# Kesai Transcoder

Kesai Transcoder is a production-grade video transcoding system engineered for robustness, maintainability, and scalability. It provides a comprehensive backend solution for processing video uploads, real-time transcoding (with multi-quality support), thumbnail and storyboard generation (with WebVTT integration), and live status updates via WebSocket (Socket.IO). The repository is organized into two main components:

-   **backend**: A Node.js/TypeScript server that handles video processing, job queuing, database interactions, and real-time communication.
-   **frontend**: A modern user interface for uploading videos, monitoring transcoding progress, and viewing the processed outputs.

---

## Table of Contents

-   [Architecture Overview](#architecture-overview)
-   [Prerequisites](#prerequisites)
-   [Installation & Setup](#installation--setup)
    -   [Backend Setup](#backend-setup)
    -   [Frontend Setup](#frontend-setup)
-   [Running the Application](#running-the-application)
-   [API Endpoints](#api-endpoints)
-   [Directory Structure](#directory-structure)
-   [Contributing](#contributing)
-   [License](#license)

---

## Architecture Overview

The backend is designed using a modular architecture with clear separation of concerns. Key components include:

-   **Controllers:** Handle HTTP request logic (e.g., video uploads, initiating transcoding jobs).
-   **Services:** Encapsulate business logic for video processing tasks such as transcoding, thumbnail generation, storyboard creation, and job management.
-   **Routes:** Define API endpoints and integrate middleware (e.g., Multer for file uploads).
-   **Models & Utilities:** Provide TypeScript interfaces and helper functions (e.g., file hashing, video probing, logging, and blurhash generation).
-   **Real-Time Communication:** Socket.IO is used to push real-time updates to connected clients, ensuring the frontend remains in sync with backend processing events.

---

## Prerequisites

Before setting up Kesai Transcoder, ensure you have the following installed on your system:

-   **Node.js** (v14+)
-   **pnpm** (v6+)
-   **ffmpeg/ffprobe:** Must be installed and accessible via your system's PATH.
-   **SQLite:** The backend uses SQLite (via Better SQLite3) for lightweight, file-based data storage.

---

## Installation & Setup

### Backend Setup

1. **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    ```

3. **Build the project (for production builds):**

    ```bash
    pnpm run build
    ```

4. **Start the server:**

    - For development (with hot reloading):
        ```bash
        pnpm run dev
        ```
    - For production:
        ```bash
        pnpm start
        ```

    The backend server will run on the configured port (default is `3000`).

### Frontend Setup

1. **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    ```

3. **Start the frontend application:**

    ```bash
    pnpm start
    ```

    The frontend application will typically run on a different port (e.g., `3001`), and it is configured to interact with the backend API and WebSocket endpoints.

---

## Running the Application

1. **Launch the Backend:**  
   Start the backend server as described above.

2. **Launch the Frontend:**  
   Start the frontend application to access the UI.

3. **Upload & Process Videos:**  
   Use the frontend interface to upload videos. The backend will:
    - Analyze the video (compute SHA-256, probe metadata).
    - Enqueue transcoding jobs based on selectable quality presets.
    - Emit real-time status updates via WebSocket so that the frontend reflects current job progress and completion without requiring manual refresh.

---

## API Endpoints

-   **POST /api/upload**  
    Upload a video file. The backend processes the file (hashing, probing) and responds with video metadata and allowed quality presets.

-   **GET /api/videos**  
    Retrieve a list of all video records along with their current processing status.

-   **POST /api/transcode**  
    Initiate the transcoding process for a video by providing its ID and the desired quality options. This action enqueues a transcoding job.

-   **Static Assets:**  
    Transcoded outputs (e.g., master playlists, thumbnails) are served via the `/outputs` endpoint.

---

## Directory Structure

```
├── backend
│   ├── src
│   │   ├── config
│   │   │   └── config.ts          # Configuration settings (paths, ports, etc.)
│   │   ├── controllers            # HTTP request handlers for uploads and transcoding
│   │   │   ├── videoController.ts
│   │   │   └── transcodeController.ts
│   │   ├── models                 # TypeScript interfaces (Video, Job, etc.)
│   │   │   └── Video.ts
│   │   ├── routes                 # API endpoint definitions
│   │   │   ├── videoRoutes.ts
│   │   │   └── transcodeRoutes.ts
│   │   ├── services               # Business logic (job processing, database, ffmpeg, Socket.IO)
│   │   │   ├── database.ts
│   │   │   ├── ffmpegService.ts
│   │   │   ├── jobProcessor.ts
│   │   │   ├── socketService.ts
│   │   │   └── videoService.ts
│   │   └── utils                  # Helper utilities (hashing, probing, logging, blurhash)
│   │       ├── blurhash.ts
│   │       ├── hash.ts
│   │       ├── logger.ts
│   │       └── probe.ts
│   ├── uploads                    # Storage for uploaded video files
│   ├── outputs                    # Storage for transcoded outputs
│   ├── package.json
│   └── tsconfig.json
└── frontend                       # Frontend application (e.g., React, Vue, Angular)
    ├── public
    ├── src
    ├── package.json
    └── ...
```

---

## Contributing

Contributions to Kesai Transcoder are welcome. Please fork the repository and submit pull requests with detailed descriptions of your changes. All contributions should adhere to the project's code style guidelines and include relevant tests and documentation.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

-   **ffmpeg/ffprobe:** Providing the core multimedia processing capabilities.
-   **Socket.IO:** Enabling real-time communication between the backend and frontend.
-   **The Node.js & TypeScript Communities:** For their invaluable tools and resources.