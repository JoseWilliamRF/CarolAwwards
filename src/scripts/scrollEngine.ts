import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ============================================================
// BLOCO 1 – INICIALIZAÇÃO DO SCROLL SUAVE (LENIS)
// ============================================================
// Cria a instância do LocomotiveScroll (que internamente usa Lenis)
// lerp: fator de inércia (0.07 = bem suave)
// wheelMultiplier: sensibilidade da roda do mouse
// smoothTouch: false mantém o scroll nativo em dispositivos touch

export function initScrollEngine() {
  const locoScroll = new LocomotiveScroll({
    lenisOptions: {
      lerp: 0.09,
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
  // BLOCO 2 – PARALLAX DO GRID DA HERO
  // ============================================================
  // Armazena a altura da viewport para o cálculo do parallax

  let heroHeightParallax = window.innerHeight;
  const heroGrid = document.querySelector('.hero__grid-wrapper') as HTMLElement;
  if (heroGrid) {
    const updateParallax = ({ scroll }: { scroll: number }) => {
      const rawProgress = Math.min(1, Math.max(0, scroll / heroHeightParallax));

      // Aplica uma curva easeInOutSine ao progresso para um movimento mais orgânico
      const progress = -(Math.cos(Math.PI * rawProgress) - 1) / 2;

      const scale = 1 - 0.15 * progress;
      heroGrid.style.transform = `translate(-50%, -50%) rotate(-30deg) scale(${scale})`;
    };

    lenis.on('scroll', updateParallax);
    window.addEventListener('resize', () => {
      heroHeightParallax = window.innerHeight;
    });
  }

  // ============================================================
  // BLOCO 3 – MOTOR DE SNAP (DECISÃO DE SUBIR OU DESCER)
  // ============================================================
  // Obtém a seção Hero; todo o snap só funciona se ela existir

  const heroSection = document.querySelector('#hero') as HTMLElement;

  if (heroSection) {
    let heroHeight = heroSection.offsetHeight || window.innerHeight;
    let lower = heroHeight * 0.48;
    let upper = heroHeight * 0.52;
    let lastDirection: 'up' | 'down' | null = null;

    window.addEventListener('resize', () => {
      heroHeight = heroSection.offsetHeight || window.innerHeight;
      lower = heroHeight * 0.48;
      upper = heroHeight * 0.52;
    });

    let lastScroll = lenis.scroll ?? 0;
    let lastTime = performance.now();
    let smoothVelocity = 0;
    let snapArmed = true;

    // Curva de easing para a animação do snap (easeOutQuad com expoente 1.5)

    const frictionEase = (t: number) => 1 - Math.pow(1 - t, 1.5);

    function checkSnap() {
      const currentScroll = lenis.scroll ?? 0;
      const now = performance.now();
      const dt = Math.max((now - lastTime) / 1000, 0.001); // segundos
      const velocity = Math.abs(currentScroll - lastScroll) / dt;

      const alpha = 0.3;
      smoothVelocity = alpha * velocity + (1 - alpha) * smoothVelocity;

      // GATILHO: Dispara apenas quando a inércia do Lenis cai abaixo de 180px/frame
      if (currentScroll > 0 && currentScroll < heroHeight && velocity < 180) {
        if (snapArmed) {
          snapArmed = false;

          let direction: 'up' | 'down';
          if (currentScroll < lower) {
            direction = 'up';
          } else if (currentScroll > upper) {
            direction = 'down';
          } else {
            direction = lastDirection || 'up'; // se for a primeira vez, sobe
          }
          lastDirection = direction;

          const target = direction === 'up' ? 0 : heroHeight;
          const distance = Math.abs(target - currentScroll);
          const dynamicDuration = Math.min(
            Math.max(distance / (smoothVelocity || 1), 0.6),
            1.3,
          );

          lenis.scrollTo(target, {
            duration: dynamicDuration,
            easing: frictionEase,
          });
        }
      } else if (velocity >= 100) {
        snapArmed = true;
      }

      lastScroll = currentScroll;
      lastTime = now;
      requestAnimationFrame(checkSnap);
    }

    requestAnimationFrame(checkSnap);
  }
}
