import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";

export default {
  preprocess: [preprocess(), vitePreprocess({})], // Customize as needed
  kit: {
    adapter: adapter({
      pages: "build", // Directory for static pages
      assets: "build", // Directory for static assets
      strict: false,
      fallback: 'index.html', // SPA fallback, set to a file like 'index.html' if needed
    }),
    prerender: {
      crawl: false,
      entries: ['/']
      // default: true,
      // crawl: false,
      // entries: [], // Define specific paths if needed
    },
    serviceWorker: {
      register: true,
      files: () => ["src/service-worker.js"],
    },
    alias: {
      $lib: "./src/lib",
      "@/*": "./src/lib"
    }
  },
};