import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Aqui é onde a mágica acontece. O adapter-vercel NÃO gera pasta "public"
    adapter: adapter()
  }
};

export default config;