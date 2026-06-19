import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollEngine() {
  // ============================================================
  // BLOCO 1 – INICIALIZAÇÃO
  // ============================================================
  const locoScroll = new LocomotiveScroll({
    lenisOptions: {
      lerp: 0.12, // ← era 0.09 (desacelera mais rápido)
      wheelMultiplier: 1.3,
      smoothWheel: true,
      smoothTouch: false,
    },
  });

  const lenis = (locoScroll as any).lenisInstance;
  (window as any).lenisInstance = lenis;

  const preloader = document.getElementById('preloader');
  if (preloader) {
    lenis.stop();
    window.addEventListener(
      'preloaderComplete',
      () => {
        lenis.start();
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      },
      { once: true },
    );
  }

  // ============================================================
  // BLOCO 2 – PARALLAX DA HERO
  // ============================================================
  let heroHeightParallax = window.innerHeight;
  const heroSec = document.querySelector('.hero') as HTMLElement | null;
  const heroGrid = document.querySelector(
    '.hero__grid-wrapper',
  ) as HTMLElement | null;

  if (heroGrid) {
    const updateParallax = ({ scroll }: { scroll: number }) => {
      const rawProgress = Math.min(1, Math.max(0, scroll / heroHeightParallax));
      const progress = -(Math.cos(Math.PI * rawProgress) - 1) / 2;
      const scale = 1 - 0.15 * progress;
      heroGrid.style.transform = `translate(-50%, -50%) rotate(-30deg) scale(${scale})`;

      // Clip-path linear: esconde o Hero de baixo pra cima conforme o scroll.
      // rawProgress é linear (0→1), sem easing — o corte acompanha o scroll real.
      // Ref: https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path#inset
      if (heroSec) {
        const clipPercent = rawProgress * 100;
        heroSec.style.clipPath = `inset(0 0 ${clipPercent}% 0)`;
      }
    };

    lenis.on('scroll', updateParallax);
    window.addEventListener('resize', () => {
      heroHeightParallax = window.innerHeight;
    });
  }

  // ============================================================
  // BLOCO 3 – MOTOR DE SNAP
  // ============================================================
  const pacotesSec = document.querySelector('#pacotes') as HTMLElement | null;
  const historiasSec = document.querySelector(
    '#historias',
  ) as HTMLElement | null;

  if (!pacotesSec) return;

  console.log(
    '%c[MOTOR LIGADO] Disjuntores armados',
    'background: green; color: white',
  );

  let lastScroll = lenis.scroll ?? 0;
  let lastTime = performance.now();
  let smoothVelocity = 0;
  let snapArmed = true;
  let lastDirection: 'up' | 'down' | null = null;

  const frictionEase = (t: number) => 1 - Math.pow(1 - t, 2.0);

  function checkSnap() {
    const currentScroll = lenis.scroll ?? 0;
    const now = performance.now();
    const dt = Math.max((now - lastTime) / 1000, 0.001);
    const velocity = Math.abs(currentScroll - lastScroll) / dt;

    const alpha = 0.5;
    smoothVelocity = alpha * velocity + (1 - alpha) * smoothVelocity;

    // ====================================================================
    // DISJUNTOR 1: HERO <-> PACOTES
    // ====================================================================
    if (
      currentScroll > 0 &&
      currentScroll < pacotesSec!.offsetTop &&
      velocity < 200
    ) {
      if (snapArmed) {
        snapArmed = false;
        const pos = pacotesSec!.offsetTop;

        let direction: 'up' | 'down' =
          currentScroll < pos * 0.48
            ? 'up'
            : currentScroll > pos * 0.52
              ? 'down'
              : lastDirection || 'up';
        lastDirection = direction;

        const target = direction === 'up' ? 0 : pos;
        console.log(`%c[CIRCUITO 1] Alvo: ${target}px`, 'color: #3498db;');

        const distance = Math.abs(target - currentScroll);
        const dynamicDuration = Math.min(
          Math.max(distance / (smoothVelocity || 1), 0.3),
          1.1,
        );
        lenis.scrollTo(target, {
          duration: dynamicDuration,
          easing: frictionEase,
        });
      }
    }
    // ====================================================================
    // DISJUNTOR 2: PACOTES <-> HISTÓRIAS (DESKTOP)
    // ====================================================================
    else if (
      historiasSec &&
      window.innerWidth > 768 &&
      currentScroll > pacotesSec!.offsetTop &&
      currentScroll < historiasSec.offsetTop &&
      velocity < 300
    ) {
      if (snapArmed) {
        snapArmed = false;
        const top = pacotesSec!.offsetTop;
        const bottom = historiasSec.offsetTop;
        const height = bottom - top;

        let direction: 'up' | 'down' =
          currentScroll < top + height * 0.48
            ? 'up'
            : currentScroll > top + height * 0.52
              ? 'down'
              : lastDirection || 'up';
        lastDirection = direction;

        const target = direction === 'up' ? top : bottom;
        console.log(`%c[CIRCUITO 2] Alvo: ${target}px`, 'color: #e67e22;');

        const distance = Math.abs(target - currentScroll);
        const dynamicDuration = Math.min(
          Math.max(distance / (smoothVelocity || 1), 0.5),
          1.2,
        );
        lenis.scrollTo(target, {
          duration: dynamicDuration,
          easing: frictionEase,
        });
      }
    }
    // ====================================================================
    // DISJUNTOR 2 MOBILE: encaixe suave nas bordas
    // ====================================================================
    else if (
      historiasSec &&
      window.innerWidth <= 768 &&
      currentScroll > pacotesSec!.offsetTop &&
      currentScroll < historiasSec.offsetTop &&
      velocity < 80
    ) {
      if (snapArmed) {
        const top = pacotesSec!.offsetTop;
        const bottom = historiasSec.offsetTop;
        const zone = bottom - top;
        const edge = zone * 0.25;

        const nearTop = currentScroll - top < edge;
        const nearBottom = bottom - currentScroll < edge;

        if (nearTop || nearBottom) {
          snapArmed = false;
          const direction: 'up' | 'down' = nearTop ? 'up' : 'down';
          lastDirection = direction;
          const target = direction === 'up' ? top : bottom;
          console.log(`%c[CIRCUITO 2📱] Alvo: ${target}px`, 'color: #e67e22;');

          const distance = Math.abs(target - currentScroll);
          const dynamicDuration = Math.min(
            Math.max(distance / (smoothVelocity || 1), 0.25),
            0.6,
          );
          lenis.scrollTo(target, {
            duration: dynamicDuration,
            easing: frictionEase,
          });
        }
      }
    }
    // ====================================================================
    // REARME DO MOTOR APÓS A ZONA DE GRAVIDADE
    // ====================================================================
    else if (velocity >= 100) {
      snapArmed = true;
    }

    lastScroll = currentScroll;
    lastTime = now;
    requestAnimationFrame(checkSnap);
  }

  requestAnimationFrame(checkSnap);
}
