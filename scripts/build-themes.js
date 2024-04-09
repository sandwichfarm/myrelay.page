import postcss from 'postcss';
import fs from 'fs/promises'; 
import path from 'path';
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const plugins = [
  tailwindcss(),
  autoprefixer()
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = path.join(__dirname, '../src/lib/assets/themes');
const outputDir = path.join(__dirname, '../static/themes');

async function processCssFile(filename) {
  const inputPath = path.join(sourceDir, filename);
  const outputPath = path.join(outputDir, filename);

  try {
    const css = await fs.readFile(inputPath);
    const result = await postcss(plugins).process(css, { from: inputPath, to: outputPath });
    await fs.writeFile(outputPath, result.css);
    if (result.map) {
      await fs.writeFile(`${outputPath}.map`, result.map.toString());
    }
    console.log(`Processed ${filename}`);
  } catch (err) {
    console.error(`Error processing ${filename}:`, err);
  }
}

async function processAllCssFiles() {
  try {
    const files = await fs.readdir(sourceDir);
    const cssFiles = files.filter(file => path.extname(file) === '.css');
    
    for (const filename of cssFiles) {
      await processCssFile(filename);
    }
  } catch (err) {
    console.error('Error processing files:', err);
  }
}

processAllCssFiles();