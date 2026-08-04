import { buildSync } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

buildSync({
  entryPoints: [path.join(__dirname, 'collector.js')],
  bundle: true,
  format: 'iife',
  outfile: path.join(__dirname, '../../static/collector.js'),
  target: ['es2015'],
  minify: false,
});

console.log('collector.js bundled successfully');
