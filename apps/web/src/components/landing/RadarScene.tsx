import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const beats = [
  { code: '01', title: 'Locate', copy: 'GPS and IP intelligence resolve every visit into a usable geographic signal.' },
  { code: '02', title: 'Identify', copy: 'Device, browser, network and behavioral fingerprints build a precise session profile.' },
  { code: '03', title: 'Assess', copy: 'Bot, VPN, privacy and authenticity scoring surface the sessions that need attention.' },
  { code: '04', title: 'Automate', copy: 'Live events, exports and signed webhooks move the signal into your existing workflow.' },
];

interface RadarSceneProps {
  motionEnabled: boolean;
  scroller: HTMLElement | null;
  runtimeReady: boolean;
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    });
  });
}

export default function RadarScene({ motionEnabled, scroller, runtimeReady }: RadarSceneProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeBeat, setActiveBeat] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas || !scroller || !runtimeReady) return;

    let disposed = false;
    let started = false;
    let teardownRenderer: (() => void) | undefined;
    setStatus('loading');
    setActiveBeat(0);

    const start = () => {
      if (started || disposed) return;
      started = true;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: window.innerWidth > 700,
          alpha: true,
          powerPreference: 'high-performance',
        });
      } catch {
        setStatus('error');
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.1 : 1.55));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.08, 5.35);
      const key = new THREE.DirectionalLight(0xff6428, 7.2);
      key.position.set(3, 3, 4);
      const rim = new THREE.DirectionalLight(0x22d8ff, 5.4);
      rim.position.set(-4, 1, -2);
      const fill = new THREE.AmbientLight(0xffffff, 1.35);
      scene.add(key, rim, fill);

      let model: THREE.Group | null = null;
      let pivot: THREE.Object3D | null = null;
      let frame = 0;
      let scrollTimeline: gsap.core.Timeline | null = null;
      let renderVisible = true;

      const resize = () => {
        const width = Math.max(1, canvas.clientWidth || window.innerWidth);
        const height = Math.max(1, canvas.clientHeight || window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.1 : 1.55));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };

      const renderFrame = () => {
        if (renderVisible) renderer.render(scene, camera);
        frame = requestAnimationFrame(renderFrame);
      };

      const visibilityObserver = new IntersectionObserver(([entry]) => {
        renderVisible = entry.isIntersecting;
        if (renderVisible) renderer.render(scene, camera);
      }, { root: scroller, rootMargin: '160px' });
      visibilityObserver.observe(section);
      window.addEventListener('resize', resize, { passive: true });
      resize();

      const loader = new GLTFLoader();
      loader.load('/media/models/gps-radar-module.glb', (gltf) => {
        if (disposed) {
          disposeScene(gltf.scene as unknown as THREE.Scene);
          return;
        }

        const content = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(content);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        content.position.sub(center);

        model = new THREE.Group();
        model.add(content);
        const fit = 2.72 / Math.max(size.x, size.y, size.z, 0.1);
        model.scale.setScalar(fit);
        model.rotation.set(-0.16, -0.68, 0.08);
        model.position.set(window.innerWidth < 700 ? 0.52 : 0.78, 0.35, 0);

        content.traverse((object) => {
          const name = object.name.toLowerCase();
          if (!pivot && (name.includes('pivot') || name.includes('arrow') || name.includes('needle') || name.includes('satel'))) {
            pivot = object;
          }
        });

        scene.add(model);
        setStatus('ready');
        renderer.render(scene, camera);

        if (motionEnabled) {
          const sticky = section.querySelector<HTMLElement>('.radar-sticky');
          if (sticky) {
            scrollTimeline = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: section,
                scroller,
                start: 'top top',
                end: 'bottom bottom',
                pin: sticky,
                pinSpacing: false,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                scrub: 0.5,
                onUpdate: ({ progress }) => {
                  const nextBeat = Math.min(3, Math.floor(progress * 4));
                  setActiveBeat((current) => current === nextBeat ? current : nextBeat);
                  section.style.setProperty('--radar-progress', progress.toFixed(3));
                  section.style.setProperty('--radar-warmth', Math.sin(progress * Math.PI).toFixed(3));
                },
              },
            });

            scrollTimeline
              .to(model.rotation, { x: 0.2, y: Math.PI * 0.9, z: -0.08, duration: 1 }, 0)
              .to(model.position, { x: window.innerWidth < 700 ? 0.25 : 0.55, y: -0.48, duration: 1 }, 0)
              .to(model.scale, { x: fit * 1.14, y: fit * 1.14, z: fit * 1.14, duration: 0.5 }, 0)
              .to(model.scale, { x: fit * 0.92, y: fit * 0.92, z: fit * 0.92, duration: 0.5 }, 0.5)
              .to(camera.position, { x: 0.2, y: -0.08, z: 4.25, duration: 0.5 }, 0)
              .to(camera.position, { x: -0.12, y: 0.16, z: 5.5, duration: 0.5 }, 0.5)
              .to(key, { intensity: 10, duration: 0.5 }, 0)
              .to(key, { intensity: 5.5, duration: 0.5 }, 0.5)
              .to(rim, { intensity: 3.8, duration: 0.5 }, 0)
              .to(rim, { intensity: 8, duration: 0.5 }, 0.5);
            if (pivot) scrollTimeline.to(pivot.rotation, { y: pivot.rotation.y + Math.PI * 7, duration: 1 }, 0);
          }
          frame = requestAnimationFrame(renderFrame);
        }

        requestAnimationFrame(() => ScrollTrigger.refresh());
      }, undefined, () => {
        if (!disposed) setStatus('error');
      });

      teardownRenderer = () => {
        cancelAnimationFrame(frame);
        scrollTimeline?.scrollTrigger?.kill();
        scrollTimeline?.kill();
        visibilityObserver.disconnect();
        window.removeEventListener('resize', resize);
        disposeScene(scene);
        renderer.dispose();
        renderer.forceContextLoss();
      };
    };

    const loadObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        start();
        loadObserver.disconnect();
      }
    }, { root: scroller, rootMargin: '1400px 0px', threshold: 0 });
    loadObserver.observe(section);

    return () => {
      disposed = true;
      loadObserver.disconnect();
      teardownRenderer?.();
    };
  }, [motionEnabled, runtimeReady, scroller]);

  const beat = beats[activeBeat];

  return (
    <section id="radar" ref={sectionRef} className="radar-sequence">
      <div className="radar-sticky">
        <canvas ref={canvasRef} className="radar-canvas" role="img" aria-label="Animated NetLogger GPS radar module" />
        {status === 'loading' && <div className="radar-fallback">CALIBRATING RADAR MODULE…</div>}
        {status === 'error' && <div className="radar-fallback radar-fallback--error"><span>+</span><strong>RADAR SIGNAL</strong><small>3D MODULE UNAVAILABLE</small></div>}
        <p className="radar-kicker">ONE VISIT // FOUR SIGNAL LAYERS</p>
        <div className="radar-copy" aria-live="polite" key={beat.code}>
          <span>{beat.code} / 04</span>
          <h2>{beat.title}</h2>
          <p>{beat.copy}</p>
        </div>
        <div className="radar-progress" aria-hidden="true">{beats.map((item, index) => <i key={item.code} className={index <= activeBeat ? 'active' : ''} />)}</div>
        {!motionEnabled && <ol className="radar-static-beats">{beats.map((item) => <li key={item.code}><span>{item.code}</span><strong>{item.title}</strong><p>{item.copy}</p></li>)}</ol>}
      </div>
    </section>
  );
}
