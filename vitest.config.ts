import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import type { UserConfig } from 'vitest/config';

const config: UserConfig = defineConfig({
  plugins: [
    svelte(),
  ],
  resolve: {
    conditions: ['browser'],
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});

export default config;
