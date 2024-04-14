import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import mkcert from 'vite-plugin-mkcert'

/** @type {import('vite').Plugin} */
const viteServerConfig = {
  name: 'log-request-middleware',
  configureServer(server) {
      server.middlewares.use((req, res, next) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
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
	debug: true
});