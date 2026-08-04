import { useEffect, useRef } from 'react';

interface NoiseLayerProps {
  motionEnabled: boolean;
  className?: string;
}

const GRAIN_FPS = 12;
const FRAME_INTERVAL = 1000 / GRAIN_FPS;

/**
 * Fine, low-contrast film grain for the landing page.
 */
export default function NoiseLayer({ motionEnabled, className }: NoiseLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    let frame = 0;
    let disposed = false;
    let lastPaint = -Infinity;
    let imageData: ImageData | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const resizeBitmap = (cssWidth: number, cssHeight: number) => {
      // Render at a moderate resolution and let the browser soften the result.
      // The caps keep the per-frame work bounded on ultrawide displays.
      const width = Math.min(960, Math.max(320, Math.ceil(cssWidth * 0.48)));
      const height = Math.min(600, Math.max(180, Math.ceil(cssHeight * 0.48)));

      if (canvas.width === width && canvas.height === height && imageData) return;
      canvas.width = width;
      canvas.height = height;
      imageData = context.createImageData(width, height);
    };

    const measure = () => {
      const bounds = canvas.getBoundingClientRect();
      resizeBitmap(bounds.width || window.innerWidth, bounds.height || window.innerHeight);
    };

    const paint = () => {
      if (!imageData) measure();
      if (!imageData) return;

      const pixels = imageData.data;
      for (let index = 0; index < pixels.length; index += 4) {
        const sample = Math.random();
        const luminance = 88 + Math.floor(sample * 88);

        pixels[index] = luminance;
        pixels[index + 1] = luminance;
        pixels[index + 2] = luminance;
        pixels[index + 3] = 52 + Math.floor(Math.random() * 50);
      }

      context.putImageData(imageData, 0, 0);
    };

    const animate = (time: number) => {
      if (disposed) return;

      if (time - lastPaint >= FRAME_INTERVAL) {
        paint();
        lastPaint = time;
      }

      frame = requestAnimationFrame(animate);
    };

    const onResize = () => {
      measure();
      paint();
    };

    measure();
    paint();

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', onResize);
    }

    if (motionEnabled) frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [motionEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        imageRendering: 'auto',
        pointerEvents: 'none',
      }}
    />
  );
}
