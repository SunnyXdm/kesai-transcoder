import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Blurhash } from 'react-blurhash';
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	CheckSquare,
	Clock,
	Cog,
	FileVideo,
	Square,
	Copy,
	CheckIcon,
	ExternalLink,
	ListOrdered,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { API_URL, BASE_URL } from '@/lib/constants';
import { toast } from 'sonner';

interface VideoCardProps {
	video: {
		id: number;
		storedFile: string;
		originalName: string;
		qualities: string;
		m3u8Url: string | null;
		thumbnailUrl: string | null;
		blurhash: string | null;
		status: 'queued' | 'pending' | 'processing' | 'completed' | 'failed';
		queuePosition?: number;
		createdAt: string;
	};
	onTranscode: (fileId: number, qualities: string[]) => Promise<any>;
	progress: Record<string, string>;
}

export function VideoCard({ video, onTranscode, progress }: VideoCardProps) {
	const [selectedQualities, setSelectedQualities] = useState<string[]>([]);
	const [transcoding, setTranscoding] = useState<boolean>(false);
	const [imgLoaded, setImgLoaded] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showUrlDialog, setShowUrlDialog] = useState(false);
	const [isSecureContext, setIsSecureContext] = useState(true);

	// Check if we're in a secure context (HTTPS or localhost)
	useEffect(() => {
		setIsSecureContext(window.isSecureContext);
	}, []);

	// Memoize allowed qualities to prevent recreation on every render
	const allowedQualities = useMemo(
		() => video.qualities.split(',').filter(Boolean),
		[video.qualities]
	);

	// Initialize selected qualities only once when the component mounts
	useEffect(() => {
		if (
			!initialized &&
			video.status === 'pending' &&
			allowedQualities.length > 0
		) {
			setSelectedQualities(allowedQualities);
			setInitialized(true);
		}
	}, [initialized, video.status, allowedQualities]);

	// Reset initialization when video changes
	useEffect(() => {
		setInitialized(false);
	}, []);

	const handleCheckboxChange = useCallback((quality: string) => {
		setSelectedQualities((prev) =>
			prev.includes(quality)
				? prev.filter((q) => q !== quality)
				: [...prev, quality]
		);
	}, []);

	const handleStartTranscode = async () => {
		if (selectedQualities.length === 0) {
			setError('Please select at least one quality option');
			return;
		}

		setError(null);
		setTranscoding(true);

		try {
			await onTranscode(video.id, selectedQualities);
		} catch (err: any) {
			setError(err.message || 'Failed to start transcoding');
			setTranscoding(false);
		}
	};

	const getStreamUrl = () => {
		if (!video.m3u8Url) return '';
		return `${API_URL}${video.m3u8Url}`;
	};

	// Handle copying URL based on environment
	const handleCopyUrl = async () => {
		const url = getStreamUrl();
		if (!url) return;

		if (isSecureContext) {
			try {
				await navigator.clipboard.writeText(url);
				setCopied(true);
				toast.success('Stream URL copied to clipboard');
				setTimeout(() => setCopied(false), 2000);
			} catch (err) {
				toast.error('Failed to copy URL');
				// Fallback to dialog if clipboard access fails
				setShowUrlDialog(true);
			}
		} else {
			// Show dialog for non-secure contexts
			setShowUrlDialog(true);
		}
	};

	const statusConfig = {
		queued: {
			icon: ListOrdered,
			label: 'Queued',
			color: 'text-purple-500 dark:text-purple-400',
			bg: 'bg-purple-500/10 dark:bg-purple-400/10',
		},
		pending: {
			icon: Clock,
			label: 'Pending',
			color: 'text-yellow-500 dark:text-yellow-400',
			bg: 'bg-yellow-500/10 dark:bg-yellow-400/10',
		},
		processing: {
			icon: Cog,
			label: 'Processing',
			color: 'text-blue-500 dark:text-blue-400',
			bg: 'bg-blue-500/10 dark:bg-blue-400/10',
		},
		completed: {
			icon: CheckCircle,
			label: 'Completed',
			color: 'text-green-500 dark:text-green-400',
			bg: 'bg-green-500/10 dark:bg-green-400/10',
		},
		failed: {
			icon: AlertCircle,
			label: 'Failed',
			color: 'text-red-500 dark:text-red-400',
			bg: 'bg-red-500/10 dark:bg-red-400/10',
		},
	};

	const StatusIcon = statusConfig[video.status].icon;

	const renderQueueInfo = () => {
		if (
			video.status !== 'queued' ||
			typeof video.queuePosition === 'undefined'
		)
			return null;

		return (
			<div className='mt-2 text-sm text-muted-foreground'>
				<div className='flex items-center gap-2'>
					<ListOrdered className='h-4 w-4' />
					<span>Queue position: {video.queuePosition + 1}</span>
				</div>
				<p className='mt-1 text-xs'>
					Your video will be processed automatically when it reaches
					the front of the queue.
				</p>
			</div>
		);
	};

	return (
		<>
			<Card className='group overflow-hidden bg-card pt-0'>
				<div className='relative aspect-video w-full overflow-hidden bg-muted'>
					{video.blurhash && !imgLoaded && (
						<Blurhash
							hash={video.blurhash}
							width='100%'
							height='100%'
							resolutionX={32}
							resolutionY={32}
							punch={1}
						/>
					)}
					{video.thumbnailUrl ? (
						<img
							src={`${BASE_URL}${video.thumbnailUrl}`}
							alt={`Thumbnail for ${video.originalName}`}
							className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
							onLoad={() => setImgLoaded(true)}
						/>
					) : (
						<div className='flex h-full items-center justify-center'>
							<FileVideo className='h-16 w-16 text-muted-foreground/50' />
						</div>
					)}
					<div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-4'>
						<div className='flex items-center gap-2'>
							<Badge
								variant='outline'
								className={cn(
									'font-medium border-0',
									statusConfig[video.status].bg,
									statusConfig[video.status].color
								)}
							>
								<StatusIcon
									className={cn(
										'mr-1.5 h-3.5 w-3.5',
										video.status === 'processing' &&
											'animate-spin'
									)}
								/>
								{statusConfig[video.status].label}
							</Badge>
						</div>
					</div>
				</div>

				<CardHeader className='space-y-2'>
					<div className='space-y-1'>
						<h3 className='font-semibold text-lg leading-none text-card-foreground line-clamp-1'>
							{video.originalName}
						</h3>
						<div className='flex items-center text-sm text-muted-foreground'>
							<Calendar className='mr-1 h-3.5 w-3.5' />
							{format(new Date(video.createdAt), 'PPP')}
						</div>
					</div>
					{renderQueueInfo()}
				</CardHeader>

				<CardContent className='space-y-4'>
					{video.status === 'pending' &&
						allowedQualities.length > 0 && (
							<div className='space-y-3'>
								<div className='text-sm font-medium text-card-foreground'>
									Select quality presets:
								</div>
								<div className='grid grid-cols-2 gap-2'>
									{allowedQualities.map((quality) => (
										<button
											key={quality}
											onClick={() =>
												handleCheckboxChange(quality)
											}
											className='flex items-center gap-2 rounded-md border border-input p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground'
										>
											{selectedQualities.includes(
												quality
											) ? (
												<CheckSquare className='h-4 w-4 text-primary' />
											) : (
												<Square className='h-4 w-4 text-muted-foreground' />
											)}
											<span className='text-foreground'>
												{quality}
											</span>
										</button>
									))}
								</div>
								{error && (
									<div className='rounded-md bg-destructive/10 p-2 text-sm text-destructive'>
										{error}
									</div>
								)}
							</div>
						)}

					{video.status === 'processing' && (
						<div className='space-y-3'>
							<div className='text-sm font-medium text-card-foreground'>
								Transcoding Progress:
							</div>
							<div className='space-y-3'>
								{allowedQualities.map((quality) => {
									const progressValue = Number.parseInt(
										progress[`${video.id}-${quality}`] ||
											'0'
									);
									return (
										<div
											key={quality}
											className='space-y-1.5'
										>
											<div className='flex justify-between text-xs'>
												<span className='text-muted-foreground'>
													{quality}
												</span>
												<span className='text-foreground font-medium'>
													{progress[
														`${video.id}-${quality}`
													] || '0'}
													%
												</span>
											</div>
											<Progress
												value={progressValue}
												className='h-1.5'
											/>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{video.status === 'completed' && (
						<div className='space-y-3'>
							<div className='space-y-2'>
								<h4 className='text-sm font-medium text-card-foreground'>
									Available Qualities
								</h4>
								<div className='flex flex-wrap gap-2'>
									{allowedQualities.map((quality) => (
										<Badge
											key={quality}
											variant='secondary'
											className='text-xs font-medium'
										>
											{quality}
										</Badge>
									))}
								</div>
							</div>
						</div>
					)}

					{video.status === 'failed' && (
						<div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
							Transcoding failed. Please try again.
						</div>
					)}
				</CardContent>

				<CardFooter>
					{video.status === 'pending' && (
						<Button
							onClick={handleStartTranscode}
							disabled={
								transcoding || selectedQualities.length === 0
							}
							className='w-full'
						>
							{transcoding ? 'Starting...' : 'Start Transcoding'}
						</Button>
					)}

					{video.status === 'completed' && video.m3u8Url && (
						<div className='flex w-full gap-2'>
							<Button
								variant='outline'
								className='flex-1'
								onClick={handleCopyUrl}
							>
								{copied ? (
									<>
										<CheckIcon className='mr-2 h-4 w-4' />
										Copied!
									</>
								) : (
									<>
										<Copy className='mr-2 h-4 w-4' />
										Copy URL
									</>
								)}
							</Button>
						</div>
					)}
				</CardFooter>
			</Card>

			<Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Stream URL</DialogTitle>
						<DialogDescription>
							Copy the stream URL below to share or play the
							video.
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<Input
							readOnly
							value={getStreamUrl()}
							onClick={(e) =>
								(e.target as HTMLInputElement).select()
							}
						/>
					</div>
					<DialogFooter className='sm:justify-start'>
						<Button variant='secondary' asChild>
							<a
								href={getStreamUrl()}
								target='_blank'
								rel='noopener noreferrer'
								className='inline-flex items-center'
							>
								<ExternalLink className='mr-2 h-4 w-4' />
								Open in new tab
							</a>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
