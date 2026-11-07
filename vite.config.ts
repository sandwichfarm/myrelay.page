import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig({
  plugins: [sveltekit()],
  define: { version: { value: pkg.version } },
});
