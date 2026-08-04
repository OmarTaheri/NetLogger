# Static media

This directory contains files that should be served unchanged by Vite.

- `images/` — photographs, illustrations, and raster backgrounds
- `videos/` — MP4, WebM, and other video files
- `icons/` — SVG and application icons
- `fonts/` — self-hosted web fonts
- `models/` — GLB, GLTF, and other 3D assets

Use lowercase kebab-case names that describe the asset, such as `typing-terminal-commands.mp4`. Reference files from the web app with root-relative URLs such as `/media/videos/hero.mp4`.

Assets imported directly by TypeScript or CSS for hashing and optimization should instead live near the consuming feature under `src/assets`.
