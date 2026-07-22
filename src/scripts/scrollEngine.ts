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
      smoothTouch: false, // ← mobile: scroll nativo do hardware (sem emulação JS)
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

  // Mobile: one-way scroll tracker (só avança, nunca volta → sem glitch de inércia)
  let maxScrollMobile = 0;

  if (heroGrid) {
    const updateParallax = ({ scroll }: { scroll: number }) => {
      // ── MOBILE: reveal one-way (só clip-path, sem scale/rotate) ──
      if (window.innerWidth <= 768) {
        // Reseta ao voltar ao topo (ex: clicou "Início")
        if (scroll < 10) maxScrollMobile = 0;

        // Lê innerHeight a cada frame — barra do Chrome muda o tamanho da tela
        const mobileHeight = window.innerHeight;
        maxScrollMobile = Math.max(maxScrollMobile, scroll);
        const raw = Math.min(1, Math.max(0, maxScrollMobile / mobileHeight));
        if (heroSec) {
          heroSec.style.clipPath = `inset(0 0 ${raw * 100}% 0)`;
        }
        return;
      }

      // ── DESKTOP: parallax completo (intocado) ──
      const rawProgress = Math.min(1, Math.max(0, scroll / heroHeightParallax));
      const progress = -(Math.cos(Math.PI * rawProgress) - 1) / 2;
      const scale = 1 - 0.15 * progress;
      heroGrid.style.transform = `translate(-50%, -50%) rotate(-30deg) scale(${scale})`;

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
    // DISJUNTOR 2 MOBILE: removido — scroll nativo do hardware gerencia o deslize.
    // Manter snap mobile causava conflito entre lenis.scrollTo e inércia do touch.
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

  // ============================================================
  // BLOCO 4 – FOOTER REVEAL (sobe com vidro via lenis.on('scroll'))
  // ============================================================
  const footerEl = document.querySelector('.footer') as HTMLElement | null;
  if (footerEl) {
    const footerInner = footerEl.querySelector('.footer__inner') as HTMLElement;
    const footerOverlay = footerEl.querySelector(
      '.footer__bg-overlay',
    ) as HTMLElement;
    const footerBottom = footerEl.querySelector(
      '.footer__bottom',
    ) as HTMLElement;

    // ═══════════════════════════════════════════════════════
    // KEYFRAMES DO CLIP-PATH
    // Cada entrada: [posição no raw (0→1), clip-path % (100→0)]
    // raw = fração do scroll disponível (0=início, 1=fim da página)
    // Mexa nos rawValues pra controlar a velocidade de cada trecho
    // ═══════════════════════════════════════════════════════
    const clipKeyframes: [number, number][] = [
      [0, 100], // início: totalmente escondido
      [0.6, 60], // 60% do scroll → só 30% revelado (bem lento)
      [0.85, 15], // 85% do scroll → 85% revelado (acelera no fim)
      [1, 0], // fim: 100% visível (garantido)
    ];

    function lerpClip(raw: number): number {
      for (let i = 0; i < clipKeyframes.length - 1; i++) {
        const [r1, c1] = clipKeyframes[i];
        const [r2, c2] = clipKeyframes[i + 1];
        if (raw >= r1 && raw <= r2) {
          const t = (raw - r1) / (r2 - r1);
          return c1 + (c2 - c1) * t;
        }
      }
      return 0;
    }

    const updateFooter = ({ scroll }: { scroll: number }) => {
      const footerTop = footerEl.offsetTop;
      const windowHeight = window.innerHeight;

      const startPoint = footerTop - windowHeight + 100;
      const pageBottom = document.body.scrollHeight - windowHeight;
      const availableScroll = Math.max(1, pageBottom - startPoint);

      const raw = Math.min(
        1,
        Math.max(0, (scroll - startPoint) / availableScroll),
      );
      const clip = lerpClip(raw);
      const progress = 1 - clip / 100; // converte clip→progress pro translateY

      const y = 80 * (1 - progress);
      const yBot = 30 * (1 - Math.min(1, progress * 1.3));

      footerInner.style.transform = `translateY(${y}px)`;
      footerInner.style.clipPath = `inset(${clip}% 0 0 0)`;
      footerOverlay.style.clipPath = `inset(${clip}% 0 0 0)`;
      footerBottom.style.transform = `translateY(${yBot}px)`;
      footerBottom.style.clipPath = `inset(${Math.max(0, clip - 10)}% 0 0 0)`;
    };

    lenis.on('scroll', updateFooter);
  }
}
