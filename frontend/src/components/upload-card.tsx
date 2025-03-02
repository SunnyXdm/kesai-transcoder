import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, X, FileVideo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { API_URL } from '@/lib/constants';
import type { UploadResponse } from '@/components/video-transcoder';

export function UploadCard() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState<boolean>(false);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles.length > 0) {
			// Only accept video files
			const file = acceptedFiles[0];
			if (file.type.startsWith('video/')) {
				setSelectedFile(file);
				setError(null);
			} else {
				setError('Please select a valid video file');
			}
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'video/*': [],
		},
		maxFiles: 1,
		multiple: false,
		disabled: uploading,
	});

	const handleUpload = async () => {
		if (!selectedFile) {
			setError('Please select a file');
			return;
		}

		setUploading(true);
		setError(null);
		setUploadProgress(0);

		const formData = new FormData();
		formData.append('video', selectedFile);

		try {
			await axios.post<UploadResponse>(
				`${API_URL}/upload`,
				formData,
				{
					headers: { 'Content-Type': 'multipart/form-data' },
					onUploadProgress: (progressEvent) => {
						if (progressEvent.total) {
							const percent = Math.round(
								(progressEvent.loaded * 100) /
									progressEvent.total
							);
							setUploadProgress(percent);
						}
					},
				}
			);

			// Reset state after successful upload
			// The new video will be broadcast via websocket
			setSelectedFile(null);
		} catch (err: any) {
			console.error('Upload error:', err);
			setError(
				err.response?.data?.message || err.message || 'Upload failed'
			);
		} finally {
			setUploading(false);
		}
	};

	const handleCancel = () => {
		setSelectedFile(null);
		setError(null);
	};

	return (
		<Card className='bg-card text-card-foreground'>
			<CardHeader>
				<CardTitle className='text-xl font-semibold'>
					Upload New Video
				</CardTitle>
			</CardHeader>
			<CardContent>
				{!selectedFile ? (
					<div
						{...getRootProps()}
						className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
							isDragActive
								? 'border-primary bg-primary/5'
								: 'border-input hover:border-primary/50'
						}`}
					>
						<input {...getInputProps()} />
						<div className='flex flex-col items-center justify-center gap-2'>
							<FileVideo className='h-12 w-12 text-muted-foreground' />
							{isDragActive ? (
								<p className='text-sm font-medium text-foreground'>
									Drop the video here...
								</p>
							) : (
								<>
									<p className='text-sm font-medium text-foreground'>
										Drag & drop a video file or click to
										select
									</p>
									<p className='text-xs text-muted-foreground'>
										Supported formats: MP4, MOV, AVI, MKV
									</p>
								</>
							)}
						</div>
					</div>
				) : (
					<div className='space-y-4'>
						<div className='flex items-center justify-between p-4 rounded-lg bg-muted'>
							<div className='flex items-center gap-3 overflow-hidden'>
								<FileVideo className='h-8 w-8 flex-shrink-0 text-primary' />
								<div className='overflow-hidden'>
									<p className='font-medium truncate text-foreground'>
										{selectedFile.name}
									</p>
									<p className='text-xs text-muted-foreground'>
										{(
											selectedFile.size /
											(1024 * 1024)
										).toFixed(2)}{' '}
										MB
									</p>
								</div>
							</div>
							<Button
								variant='ghost'
								size='icon'
								onClick={handleCancel}
								disabled={uploading}
								className='text-muted-foreground hover:text-foreground'
							>
								<X className='h-4 w-4' />
							</Button>
						</div>

						{uploading && (
							<div className='space-y-2'>
								<div className='flex justify-between text-sm'>
									<span className='text-muted-foreground'>
										Uploading...
									</span>
									<span className='text-foreground font-medium'>
										{uploadProgress}%
									</span>
								</div>
								<Progress
									value={uploadProgress}
									className='h-2'
								/>
							</div>
						)}

						<div className='flex justify-end'>
							<Button
								onClick={handleUpload}
								disabled={uploading}
								className='flex items-center gap-2'
							>
								<Upload className='h-4 w-4' />
								{uploading ? 'Uploading...' : 'Upload Video'}
							</Button>
						</div>
					</div>
				)}

				{error && (
					<div className='mt-4 p-3 text-sm rounded-md bg-destructive/10 text-destructive'>
						{error}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
