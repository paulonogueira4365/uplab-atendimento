import adapter from '@sveltejs/adapter-vercel'; // Troque o 'static' por 'vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// Isso aqui é o que diz para a Vercel como construir o site
		adapter: adapter()
	}
};

export default config;