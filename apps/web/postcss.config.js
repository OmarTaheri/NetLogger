import path from 'path';
import { fileURLToPath } from 'url';

const webRoot = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: {
      config: path.join(webRoot, 'tailwind.config.js'),
    },
    autoprefixer: {},
  },
};
