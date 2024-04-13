/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ["class"],
	content: ["../src/lib/assets/themes/*"],
  safelist: [
    "dark", 
    /.*/,
    /^mrp-/,
  ],
	mode: 'jit',
	theme: {}
};

export default config;
