import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LandingSignalChart from '../components/landing/LandingSignalChart';
import RadarScene from '../components/landing/RadarScene';
import { useAuth } from '../hooks/useAuth';

gsap.registerPlugin(ScrollTrigger);

const MOTION_STORAGE_KEY = 'netlogger:landing-motion';
const HERO_PLAYBACK_RATE = 0.72;
const HERO_CROSSFADE_LEAD = 1.05;
const HERO_CROSSFADE_MS = 950;

function SeamlessHeroVideo({ motionEnabled }: { motionEnabled: boolean }) {
  const firstRef = useRef<HTMLVideoElement>(null);
  const secondRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState(0);

  useEffect(() => {
    const firstVideo = firstRef.current;
    const secondVideo = secondRef.current;
    if (!firstVideo || !secondVideo) return;
    const videos = [firstVideo, secondVideo];

    let activeIndex = 0;
    let animationFrame = 0;
    let crossfadeTimer = 0;
    let isCrossfading = false;
    let disposed = false;

    videos.forEach((video) => {
      video.playbackRate = HERO_PLAYBACK_RATE;
      video.defaultPlaybackRate = HERO_PLAYBACK_RATE;
      video.pause();
      video.currentTime = 0;
    });
    setActiveVideo(0);

    if (!motionEnabled) return;

    const startCrossfade = () => {
      if (isCrossfading || disposed) return;

      const outgoing = videos[activeIndex];
      const nextIndex = activeIndex === 0 ? 1 : 0;
      const incoming = videos[nextIndex];
      isCrossfading = true;
      incoming.currentTime = 0;
      incoming.playbackRate = HERO_PLAYBACK_RATE;

      void incoming.play()
        .then(() => {
          if (disposed) return;
          activeIndex = nextIndex;
          setActiveVideo(nextIndex);
          crossfadeTimer = window.setTimeout(() => {
            outgoing.pause();
            outgoing.currentTime = 0;
            isCrossfading = false;
          }, HERO_CROSSFADE_MS);
        })
        .catch(() => {
          isCrossfading = false;
        });
    };

    const monitorLoop = () => {
      const current = videos[activeIndex];
      if (
        !isCrossfading
        && Number.isFinite(current.duration)
        && current.duration > 0
        && current.duration - current.currentTime <= HERO_CROSSFADE_LEAD
      ) {
        startCrossfade();
      }
      animationFrame = requestAnimationFrame(monitorLoop);
    };

    const current = videos[activeIndex];
    if (current.networkState === HTMLMediaElement.NETWORK_EMPTY) current.load();
    void current.play().catch(() => {});
    animationFrame = requestAnimationFrame(monitorLoop);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      clearTimeout(crossfadeTimer);
      videos.forEach((video) => video.pause());
    };
  }, [motionEnabled]);

  return (
    <div className="landing-hero__video-loop" aria-hidden="true">
      {[firstRef, secondRef].map((ref, index) => (
        <video
          key={index}
          ref={ref}
          className={`landing-hero__video ${activeVideo === index ? 'is-active' : ''}`}
          src="/media/videos/hero.mp4"
          muted
          playsInline
          preload="auto"
        />
      ))}
    </div>
  );
}

function ObservedVideo({
  src,
  poster,
  motionEnabled,
  scrollRoot,
}: {
  src: string;
  poster?: string;
  motionEnabled: boolean;
  scrollRoot: HTMLElement | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    let disposed = false;
    const requestPlayback = () => {
      if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) video.load();
      if (!motionEnabled) {
        video.pause();
        setState('paused');
        return;
      }
      setState('loading');
      void video.play()
        .then(() => { if (!disposed) setState('playing'); })
        .catch(() => { if (!disposed) setState('paused'); });
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) requestPlayback();
      else {
        video.pause();
        if (!disposed) setState('paused');
      }
    }, { root: scrollRoot, rootMargin: '360px 0px', threshold: 0.08 });

    const onError = () => setState('error');
    video.addEventListener('error', onError);
    observer.observe(video);

    return () => {
      disposed = true;
      observer.disconnect();
      video.removeEventListener('error', onError);
      video.pause();
    };
  }, [motionEnabled, scrollRoot]);

  return (
    <div className="observed-video" data-video-state={state}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        controls={!motionEnabled}
      />
      <span className="observed-video__status" aria-live="polite">
        {state === 'error' ? 'MEDIA SIGNAL UNAVAILABLE' : state === 'loading' ? 'BUFFERING SIGNAL' : ''}
      </span>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="public-metric"><span>{label}</span><strong className={accent ? 'accent' : ''}>{value}</strong><i /></div>;
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className} data-reveal>{children}</div>;
}

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [intro, setIntro] = useState(true);
  const [motionEnabled, setMotionEnabled] = useState(() => {
    try {
      return window.localStorage.getItem(MOTION_STORAGE_KEY) !== 'reduced';
    } catch {
      return true;
    }
  });
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const reticleRef = useRef<HTMLDivElement>(null);

  const attachScrollRoot = useCallback((node: HTMLElement | null) => setScrollRoot(node), []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(MOTION_STORAGE_KEY, motionEnabled ? 'full' : 'reduced');
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
  }, [motionEnabled]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), motionEnabled ? 1150 : 120);
    return () => clearTimeout(timer);
  }, []); // The intro only runs once per route visit.

  useEffect(() => {
    if (!motionEnabled || !window.matchMedia('(pointer:fine)').matches) return;
    const pointer = (event: PointerEvent) => {
      if (reticleRef.current) {
        reticleRef.current.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      }
    };
    window.addEventListener('pointermove', pointer, { passive: true });
    return () => window.removeEventListener('pointermove', pointer);
  }, [motionEnabled]);

  useEffect(() => {
    const content = scrollContentRef.current;
    if (!scrollRoot || !content) return;

    setRuntimeReady(false);
    scrollRoot.scrollTop = 0;
    let frame = 0;
    let disposed = false;
    let lenis: Lenis | null = null;

    const proxy = {
      scrollTop(value?: number) {
        if (typeof value === 'number') {
          if (lenis) lenis.scrollTo(value, { immediate: true });
          else scrollRoot.scrollTop = value;
        }
        return lenis?.scroll ?? scrollRoot.scrollTop;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: getComputedStyle(scrollRoot).transform !== 'none' ? 'transform' as const : 'fixed' as const,
    };

    ScrollTrigger.scrollerProxy(scrollRoot, proxy);

    if (motionEnabled) {
      lenis = new Lenis({
        wrapper: scrollRoot,
        content,
        autoRaf: false,
        lerp: 0.05,
        smoothWheel: true,
        syncTouch: false,
        gestureOrientation: 'vertical',
      });
      lenisRef.current = lenis;
      lenis.on('scroll', ScrollTrigger.update);

      const renderFrame = (time: number) => {
        lenis?.raf(time);
        ScrollTrigger.update();
        frame = requestAnimationFrame(renderFrame);
      };
      frame = requestAnimationFrame(renderFrame);
    } else {
      lenisRef.current = null;
    }

    const context = gsap.context(() => {
      if (!motionEnabled) {
        gsap.set('[data-reveal], [data-mask-line], .workflow-media, .dashboard-mock', { clearProps: 'all' });
        return;
      }

      const heroEntrance = gsap.timeline({ delay: 0.72 });
      heroEntrance
        .fromTo('[data-hero-line]', { yPercent: 118, rotate: 2 }, { yPercent: 0, rotate: 0, duration: 1.05, stagger: 0.1, ease: 'power4.out' })
        .fromTo('.landing-hero__status, .landing-hero__footer, .landing-scroll', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, '-=.55');

      gsap.timeline({
        scrollTrigger: { trigger: '.landing-hero', scroller: scrollRoot, start: 'top top', end: 'bottom top', scrub: 0.65 },
      })
        .to('.landing-hero__video', { scale: 1.2, yPercent: 10, ease: 'none' }, 0)
        .to('.landing-hero h1', { yPercent: -12, clipPath: 'inset(0 0 100% 0)', filter: 'blur(5px)', ease: 'none' }, 0)
        .to('.landing-hero__wipe', { scaleY: 1, ease: 'none' }, 0)
        .to('.landing-hero__color', { opacity: 0.5, ease: 'none' }, 0);

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.fromTo(element, { y: 96, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, scroller: scrollRoot, start: 'top 88%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-mask-line]').forEach((line) => {
        gsap.fromTo(line, { yPercent: 115, rotate: 1.5 }, {
          yPercent: 0,
          rotate: 0,
          duration: 1.1,
          ease: 'power4.out',
          scrollTrigger: { trigger: line, scroller: scrollRoot, start: 'top 88%', once: true },
        });
      });

      gsap.fromTo('.manifesto-grid', { y: 120, opacity: 0 }, {
        y: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.landing-manifesto', scroller: scrollRoot, start: 'top 55%', end: 'bottom 85%', scrub: 0.65 },
      });

      gsap.utils.toArray<HTMLElement>('.workflow-card').forEach((card, index) => {
        const media = card.querySelector<HTMLElement>('.workflow-media');
        const video = card.querySelector<HTMLVideoElement>('video');
        const copy = card.querySelector<HTMLElement>('.workflow-copy');
        if (copy) {
          gsap.fromTo(copy, { xPercent: index % 2 ? 14 : -14, opacity: 0 }, {
            xPercent: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, scroller: scrollRoot, start: 'top 78%', once: true },
          });
        }
        if (media) {
          gsap.fromTo(media, { clipPath: 'inset(16% 10% 16% 10%)', y: 100 }, {
            clipPath: 'inset(0% 0% 0% 0%)',
            y: 0,
            duration: 1.25,
            ease: 'power4.out',
            scrollTrigger: { trigger: card, scroller: scrollRoot, start: 'top 82%', once: true },
          });
        }
        if (video) {
          gsap.fromTo(video, { scale: 1.2, yPercent: -5 }, {
            scale: 1.04,
            yPercent: 5,
            ease: 'none',
            scrollTrigger: { trigger: card, scroller: scrollRoot, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
          });
        }
      });

      gsap.fromTo('.dashboard-mock', { y: 170, scale: 0.86, rotateX: 8 }, {
        y: 0,
        scale: 1,
        rotateX: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.dashboard-showcase', scroller: scrollRoot, start: 'top 72%', end: '55% 58%', scrub: 0.7 },
      });

      gsap.fromTo('.landing-cta h2 span', { xPercent: 18 }, {
        xPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.landing-cta', scroller: scrollRoot, start: 'top bottom', end: 'center center', scrub: 0.6 },
      });
    }, scrollRoot);

    const refresh = () => {
      if (!disposed) ScrollTrigger.refresh();
    };
    window.addEventListener('resize', refresh, { passive: true });
    void document.fonts?.ready.then(refresh);
    requestAnimationFrame(() => {
      refresh();
      if (!disposed) setRuntimeReady(true);
    });

    return () => {
      disposed = true;
      setRuntimeReady(false);
      window.removeEventListener('resize', refresh);
      cancelAnimationFrame(frame);
      context.revert();
      lenis?.destroy();
      if (lenisRef.current === lenis) lenisRef.current = null;
    };
  }, [motionEnabled, scrollRoot]);

  const navigateToSection = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const id = event.currentTarget.hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (lenisRef.current) lenisRef.current.scrollTo(target, { duration: 1.3 });
    else target.scrollIntoView({ behavior: 'auto' });
  }, []);

  const toggleMotion = () => {
    setRuntimeReady(false);
    setMotionEnabled((current) => !current);
  };

  return (
    <main
      ref={attachScrollRoot}
      className={`landing-shell ${motionEnabled ? 'is-motion-full' : 'is-motion-reduced'}`}
      data-motion={motionEnabled ? 'full' : 'reduced'}
    >
      <div ref={reticleRef} className="landing-reticle" />
      <div className={`landing-intro ${intro ? '' : 'is-gone'}`}><p>NETLOGGER</p><span>SIGNAL ACQUIRED</span><i /></div>

      <header className="landing-header">
        <a href="#top" onClick={navigateToSection} className="landing-logo"><i /> NETLOGGER <span>// VISITOR INTELLIGENCE</span></a>
        <nav aria-label="Landing page navigation">
          <a href="#capabilities" onClick={navigateToSection}>Capabilities</a>
          <a href="#radar" onClick={navigateToSection}>Signal stack</a>
        </nav>
        <div className="landing-auth">
          <button
            type="button"
            className="landing-motion-toggle"
            onClick={toggleMotion}
            aria-pressed={motionEnabled}
            title="Toggle landing page motion"
          >
            MOTION <span>{motionEnabled ? 'ON' : 'OFF'}</span>
          </button>
          {user ? <><Link to="/app" className="landing-login">Open app</Link><button onClick={logout}>Log out</button></> : <><Link to="/login" className="landing-login">Log in</Link><Link to="/signup" className="landing-signup">Create account</Link></>}
          <Link to="/create" className="landing-quick-link">Create a link</Link>
        </div>
      </header>

      <div ref={scrollContentRef} className="landing-scroll-content">
        <section id="top" className="landing-hero">
          <SeamlessHeroVideo motionEnabled={motionEnabled} />
          <div className="landing-hero__color" />
          <div className="landing-hero__wipe" aria-hidden="true" />
          <div className="landing-hero__status"><span>LIVE</span> OBSERVABILITY LAYER / 150+ DATA POINTS</div>
          <h1>
            <span className="landing-mask"><span data-hero-line>Know every visitor's</span></span>
            <span className="landing-mask"><strong data-hero-line>location.</strong></span>
          </h1>
          <div className="landing-hero__footer">
            <p>Real-time location, device intelligence, risk analysis and automation in one tactical dashboard.</p>
            <Link to="/create">START LOGGING SMARTER <span>↗</span></Link>
          </div>
          <a href="#manifesto" onClick={navigateToSection} className="landing-scroll">SCROLL TO TRACE <i /></a>
        </section>

        <section id="manifesto" className="landing-manifesto">
          <p className="section-index">00 / SYSTEM MANIFESTO</p>
          <h2>
            <span className="landing-mask"><span data-mask-line>Not a pageview.</span></span>
            <span className="landing-mask"><span data-mask-line>A complete session.</span></span>
          </h2>
          <div className="manifesto-grid">
            <p>NetLogger turns an anonymous click into a live, structured intelligence record—without forcing operators to stitch signals together by hand.</p>
            <div><strong>LOCATION</strong><strong>DEVICE</strong><strong>NETWORK</strong><strong>BEHAVIOR</strong><strong>RISK</strong></div>
          </div>
          <div className="signal-marquee"><div className="signal-marquee__track"><span>GPS / IP / CANVAS / WEBGL / AUDIO / BOT SCORE / VPN / HUMANITY / WEBHOOKS / </span><span>GPS / IP / CANVAS / WEBGL / AUDIO / BOT SCORE / VPN / HUMANITY / WEBHOOKS / </span></div></div>
        </section>

        <section id="capabilities" className="workflow-section">
          <p className="section-index">01—03 / FROM CLICK TO ACTION</p>
          {[
            { n: '01', verb: 'Collect', title: 'Deploy a link. Capture the session.', copy: 'Custom templates, GPS consent modes, expirations and domains give every campaign a precise collection surface.', video: '/media/videos/typing-terminal-commands.mp4' },
            { n: '02', verb: 'Analyze', title: 'Find the human inside the telemetry.', copy: 'Device fingerprints, location consistency and authenticity models turn raw attributes into an operator-ready profile.', video: '/media/videos/dual-screen.mp4' },
            { n: '03', verb: 'Act', title: 'Move on the signal while it is live.', copy: 'Realtime visitor events, filters, exports and signed webhooks keep downstream systems synchronized.', video: '/media/videos/typing-on-keyboard.mp4' },
          ].map((item, index) => (
            <article className={`workflow-card ${index % 2 ? 'workflow-card--reverse' : ''}`} key={item.n}>
              <div className="workflow-copy"><span>{item.n} / 03</span><h2>{item.verb}</h2><h3>{item.title}</h3><p>{item.copy}</p></div>
              <div className="workflow-media">
                <ObservedVideo src={item.video} motionEnabled={motionEnabled} scrollRoot={scrollRoot} />
                <div className="workflow-media__tint" />
                <span>NETLOGGER // {item.verb.toUpperCase()}</span>
              </div>
            </article>
          ))}
        </section>

        <RadarScene motionEnabled={motionEnabled} scroller={scrollRoot} runtimeReady={runtimeReady} />

        <section className="dashboard-showcase">
          <div className="dashboard-showcase__intro"><p className="section-index">04 / OPERATOR VIEW</p><Reveal><h2>Every signal.<br /><span>One command surface.</span></h2></Reveal><p>The public preview uses representative values only. Your workspace remains private from the first captured visit.</p></div>
          <div className="dashboard-mock">
            <div className="dashboard-mock__bar"><span><i /> NETLOGGER // TACTICAL HUD</span><span>SYS ONLINE&nbsp;&nbsp; 21:48:03</span></div>
            <div className="dashboard-mock__body">
              <div className="dashboard-mock__rail"><b>⌂</b><b>↗</b><b>◎</b><b>⌁</b><b>⚙</b></div>
              <div className="dashboard-mock__content">
                <div className="mock-title"><span>DASHBOARD</span><small>SYSTEM OVERVIEW</small></div>
                <div className="metric-grid"><Metric label="TOTAL VISITORS" value="12,849" accent /><Metric label="TODAY" value="384" /><Metric label="GPS GRANT RATE" value="72%" /><Metric label="ACTIVE LINKS" value="18" /></div>
                <div className="mock-panels"><div className="mock-chart"><LandingSignalChart motionEnabled={motionEnabled} /></div><div className="mock-risk"><span>RISK SIGNALS</span><b>VPN DETECTED <i>04</i></b><b>BOT SCORE &gt; 80 <i>11</i></b><b>GPS MISMATCH <i>03</i></b></div></div>
                <div className="mock-table"><span>RECENT VISITORS // LIVE</span>{[['185.42.17.9','Bangkok, TH','Chrome / Windows','92'],['81.16.4.112','Berlin, DE','Safari / iOS','08'],['103.21.88.7','Singapore, SG','Firefox / Linux','31']].map((row) => <div key={row[0]}>{row.map((cell, i) => <b key={cell} className={i === 3 ? 'score' : ''}>{cell}</b>)}</div>)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-cta"><p>READY // WHEN YOU ARE</p><h2>Start logging<br /><span>smarter.</span></h2><Link to={user ? '/app' : '/create'}>{user ? 'OPEN THE APP' : 'CREATE A GUEST LINK'} <b>↗</b></Link></section>
        <footer className="landing-footer"><strong>NETLOGGER</strong><p>Visitor intelligence for operators who need more than pageviews.</p><span>PRIVATE BY ACCOUNT // REALTIME BY DESIGN</span><small>© 2026 NETLOGGER</small></footer>
      </div>
    </main>
  );
}
