import { useState, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { UploadCard } from '@/components/upload-card';
import { VideoCard } from '@/components/video-card';
import { API_BASE_URL } from '@/lib/constants';

// Type definitions
export interface UploadResponse {
	fileId: number;
	width: number;
	height: number;
	duration: number;
	allowedQualities: string[];
}

export interface TranscodeResponse {
	jobId: number;
}

export interface ProgressUpdate {
	jobId: number;
	quality: string;
	progress: string;
}

export interface Video {
	id: number;
	storedFile: string;
	originalName: string; // Changed from originalFile to originalName
	qualities: string;
	m3u8Url: string | null;
	thumbnailUrl: string | null;
	blurhash: string | null;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	createdAt: string;
}

export function VideoTranscoder() {
	const [videos, setVideos] = useState<Video[]>([]);
	const [globalProgress, setGlobalProgress] = useState<
		Record<string, string>
	>({});

	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		// Initialize Socket.IO connection
		const sock: Socket = io(API_BASE_URL);

		// Socket event handlers
		sock.on('connect', () => {
			console.log('Socket connected');
			setIsConnected(true);
		});

		sock.on('disconnect', () => {
			console.log('Socket disconnected');
			setIsConnected(false);
		});

		sock.on('job-progress', (data: ProgressUpdate) => {
			setGlobalProgress((prev) => ({
				...prev,
				[`${data.jobId}-${data.quality}`]: data.progress,
			}));
		});

		sock.on('video-added', (video: Video) => {
			setVideos((prev) => [video, ...prev]);
		});

		sock.on('video-updated', (video: Video) => {
			setVideos((prev) =>
				prev.map((v) => (v.id === video.id ? video : v))
			);
		});

		sock.on('video-list', (videoList: Video[]) => {
			setVideos(videoList);
		});

		sock.on('job-failed', (data: { jobId: number; error: string }) => {
			console.error(`Job ${data.jobId} failed: ${data.error}`);
		});

		// Clean up on unmount
		return () => {
			sock.disconnect();
		};
	}, []);

	const handleTranscode = async (fileId: number, qualities: string[]) => {
		try {
			const response = await fetch(`${API_BASE_URL}/transcode`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fileId, qualities }),
			});

			if (!response.ok) {
				throw new Error(`Transcoding failed: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Transcoding error:', error);
			throw error;
		}
	};

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='flex items-center justify-between mb-8'>
				<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
					{/* Kesai Transcoder */}
				</h1>
				<div className='flex items-center'>
					<span
						className={`inline-block w-2 h-2 rounded-full mr-2 ${
							isConnected
								? 'bg-green-500 animate-pulse'
								: 'bg-red-500'
						}`}
					></span>
					<span className='text-sm text-gray-600 dark:text-gray-300'>
						{isConnected ? 'Connected' : 'Disconnected'}
					</span>
				</div>
			</div>

			<UploadCard />

			<div className='mt-8'>
				<h2 className='text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200'>
					Your Videos
				</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					{videos.map((video) => (
						<VideoCard
							key={video.id}
							video={video}
							onTranscode={handleTranscode}
							progress={globalProgress}
						/>
					))}
					{videos.length === 0 && (
						<div className='col-span-full text-center py-12 text-gray-500 dark:text-gray-400'>
							No videos uploaded yet. Upload a video to get
							started.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
