import { useEffect, useRef } from 'react';

const visitorSeries = [42, 58, 51, 74, 68, 96, 88, 122, 111, 148, 137, 171, 159, 196];
const riskSeries = [18, 24, 21, 34, 27, 39, 31, 48, 44, 57, 49, 62, 55, 71];

interface LandingSignalChartProps {
  motionEnabled: boolean;
}

export default function LandingSignalChart({ motionEnabled }: LandingSignalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrame = 0;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    const startedAt = performance.now();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const getPoints = (series: number[], width: number, height: number) => {
      const left = 10;
      const right = width - 8;
      const top = 15;
      const bottom = height - 22;
      const max = 210;
      return series.map((value, index) => ({
        x: left + ((right - left) * index) / (series.length - 1),
        y: bottom - ((bottom - top) * value) / max,
      }));
    };

    const trace = (points: { x: number; y: number }[], progress: number) => {
      const segmentPosition = progress * (points.length - 1);
      const completed = Math.floor(segmentPosition);
      const fraction = segmentPosition - completed;
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let index = 1; index <= completed; index += 1) context.lineTo(points[index].x, points[index].y);
      if (completed < points.length - 1) {
        const from = points[completed];
        const to = points[completed + 1];
        context.lineTo(from.x + (to.x - from.x) * fraction, from.y + (to.y - from.y) * fraction);
      }
      return { completed, fraction };
    };

    const draw = (progress: number) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / ratio;
      const height = canvas.height / ratio;
      context.clearRect(0, 0, width, height);

      context.lineWidth = 1;
      for (let row = 0; row < 5; row += 1) {
        const y = 15 + ((height - 37) * row) / 4;
        context.strokeStyle = row === 4 ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.055)';
        context.setLineDash(row === 4 ? [] : [3, 5]);
        context.beginPath();
        context.moveTo(10, y);
        context.lineTo(width - 8, y);
        context.stroke();
      }
      context.setLineDash([]);

      const visitors = getPoints(visitorSeries, width, height);
      const risk = getPoints(riskSeries, width, height);
      const end = trace(visitors, progress);
      const gradient = context.createLinearGradient(0, 12, 0, height);
      gradient.addColorStop(0, 'rgba(241,90,36,.40)');
      gradient.addColorStop(1, 'rgba(241,90,36,0)');
      context.lineTo(visitors[Math.min(end.completed + 1, visitors.length - 1)].x, height - 21);
      context.lineTo(visitors[0].x, height - 21);
      context.closePath();
      context.fillStyle = gradient;
      context.fill();

      trace(visitors, progress);
      context.strokeStyle = '#f15a24';
      context.lineWidth = 2.4;
      context.shadowColor = 'rgba(241,90,36,.7)';
      context.shadowBlur = 9;
      context.stroke();
      context.shadowBlur = 0;

      trace(risk, progress);
      context.strokeStyle = '#20d7ff';
      context.lineWidth = 1.35;
      context.stroke();

      visitors.forEach((point, index) => {
        if (index / (visitors.length - 1) > progress || index % 3 !== 0) return;
        context.fillStyle = '#f15a24';
        context.beginPath();
        context.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
        context.fill();
      });

      // Sparse deterministic dust makes this chart feel printed into the HUD
      // instead of looking like a pristine stock dashboard widget.
      context.fillStyle = 'rgba(255,255,255,.11)';
      for (let index = 0; index < 75; index += 1) {
        const x = ((index * 83) % 997) / 997 * width;
        const y = ((index * 47) % 389) / 389 * height;
        context.fillRect(x, y, index % 9 === 0 ? 1.4 : .7, .7);
      }
    };

    const animate = (time: number) => {
      if (disposed) return;
      const progress = motionEnabled ? Math.max(0, Math.min(1, (time - startedAt) / 1100)) : 1;
      draw(1 - Math.pow(1 - progress, 3));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };

    resize();
    animationFrame = requestAnimationFrame(animate);
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resize();
        draw(1);
      });
      resizeObserver.observe(canvas);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
    };
  }, [motionEnabled]);

  return (
    <div className="landing-signal-chart" role="img" aria-label="Representative 14 day visitors and risk signals chart">
      <div className="landing-signal-chart__head">
        <span>VISITORS OVER TIME</span>
        <b><i /> LIVE / 14D</b>
      </div>
      <canvas ref={canvasRef} />
      <div className="landing-signal-chart__axis"><span>JUL 20</span><span>JUL 27</span><span>AUG 02</span></div>
      <div className="landing-signal-chart__legend"><span><i /> VISITORS</span><span><i /> RISK SIGNALS</span><strong>+34.8%</strong></div>
    </div>
  );
}
