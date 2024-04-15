import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import mkcert from 'vite-plugin-mkcert'
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('package.json', import.meta.url)),
      json = readFileSync(file, 'utf8'),
      pkg = JSON.parse(json);

/** @type {import('vite').Plugin} */
const viteServerConfig = {
  name: 'log-request-middleware',
  configureServer(server) {
      server.middlewares.use((req, res, next) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET");
          res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
          res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
          next();
      });
  }
};

export default defineConfig({
	plugins: [
		sveltekit(), 
		mkcert(),
		viteServerConfig
	],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
  define: {
    version: {
      value: pkg.version,
    }
  },
	debug: true
});