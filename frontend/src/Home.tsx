import { VideoTranscoder } from '@/components/video-transcoder';
import { ModeToggle } from '@/components/mode-toggle';

export default function Home() {
	return (
		<main className='min-h-screen bg-background text-foreground transition-colors duration-300'>
			<div className='container mx-auto px-4 py-8'>
				<div className='flex items-center justify-between mb-8'>
					<h1 className='text-4xl font-bold'>Kesai Transcoder</h1>
					<ModeToggle />
				</div>
				<VideoTranscoder />
			</div>
		</main>
	);
}
