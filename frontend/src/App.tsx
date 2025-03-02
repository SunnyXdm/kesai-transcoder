import { ThemeProvider } from '@/components/theme-provider';
import Home from './Home.tsx';
import { Toaster } from 'sonner';

function App() {
	return (
		<ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
			<Home />
			<Toaster />
		</ThemeProvider>
	);
}

export default App;
