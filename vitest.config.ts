import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import type { UserConfig } from 'vitest/config';

// Correcting the integration of Vitest in the Vite configuration
const config: UserConfig = defineConfig({
  plugins: [
    svelte(),
  ],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
    },
  },
  test: {
    // Vitest specific configurations go here
    globals: true,
    environment: 'happy-dom', // or 'jsdom', depending on your preference
  },
});

export default config;
