import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // O adapter-vercel resolve o problema do diretório de saída automaticamente
    adapter: adapter(),
    alias: {
      $lib: './src/lib'
    }
  }
};

export default config;