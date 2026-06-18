# Regras do Projeto — Carolina Alves Fotografia

## 🚨 REGRA DE OURO

**NUNCA altere código sem permissão explícita.** Primeiro analise, explique a falha, proponha a solução e espere confirmação.
**NUNCA tome decisões de design (ex: escurecer fotos, alterar layouts) sem solicitação.** Aponte problemas de contraste, mas não altere o CSS por conta própria.

---

## I. AXIOMAS ARQUITETURAIS (IMUTÁVEIS)

_Regras de engenharia, performance e W3C aplicadas a 100% do projeto._

### 1. Estrutura Core e DOM

- **`src/scripts/scrollEngine.ts`**: Motor de Snap + Lenis. A inércia e os disjuntores são intocáveis.
- **`src/pages/index.astro`**: Define a ordem do DOM. Alterá-la destrói a matemática do motor de scroll.
- **CSS Crítico (`MainLayout.astro`)**: O bloco `<style is:inline>` no `<head>` contém a pintura inicial (fundo, vidro, logo). **Nunca duplique** essas regras em outros componentes (ex: `Preloader.astro`).

### 2. Motor de Snap (Disjuntores)

- **Isolamento Lógico:** Nunca generalize o snap com `Array.map` ou loops. Mantenha os disjuntores `if / else if` explícitos.
- **Integridade do `offsetTop`:** Use sempre `HTMLElement`. O cálculo de posição não pode ser afetado por `margin-top` negativo.
- **Duração Dinâmica:** A duração do scroll (Lenis) deve ser ajustada separadamente por disjuntor, baseada na altura da seção e na velocidade (smoothVelocity).

### 3. Física de Transições (Cover Reveal) e Stacking

- **Z-Index Estrito:** Nunca defina `z-index` genérico na classe `.section`. Cada seção deve ter seu `z-index` explícito (Hero = 1, e crescentemente 2, 3, 4...).
- **Proibição de `!important`:** Se precisar usar `!important` para o `z-index`, a árvore de empilhamento está estruturalmente errada. Corrija a raiz.
- **Fundo Opaco Obrigatório:** Seções que cobrem outras precisam de fundos sólidos. `transparent` ou `rgba` com alfa < 1 causarão vazamento visual da seção inferior.
- **GSAP > Sticky Múltiplo:** Apenas a Hero deve usar `position: sticky`. Para as seções seguintes, use GSAP `yPercent` na seção de saída com `scrub: true` na seção de entrada. Nunca use `margin-top: -100dvh`.

### 4. Performance (LCP) e Imagens

- **Priorização LCP:** Use `<link rel="preload" as="image">` e `loading="eager"` EXCLUSIVAMENTE para as imagens do preloader e as 2 primeiras de cada track da Hero.
- **Lazy Loading:** Imagens abaixo da dobra devem ter `loading="lazy"` + `decoding="async"`.
- **Prismic Imgix:** SEMPRE aplique a função de otimização (ex: `w=800&q=80`) nas URLs vindas do CMS. Nunca renderize imagens cruas.
- **Prevenção de Vazamento de Rede (W3C):** Nunca use `src=""` vazio em imagens fantasmas. Use o placeholder Base64: `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`.

### 5. Higiene de Código e GSAP

- **DOM Size:** Não injete objetos JSON inteiros (`JSON.stringify`) no HTML via `data-attributes`. Itere e extraia strings com delimitadores (ex: `.join('|||')`).
- **Ciclo de Vida:** Toda timeline/ScrollTrigger criada deve ser passível de destruição (`tl.kill()`).
- **Conflito de Matriz:** Nunca use `scrub: true` em elementos com `position: sticky`. Sempre que animar `scale` e `object-position`, garanta que o `transform-origin` não sofra mutação no hover.
- **Prismic Fallbacks:** Toda requisição ao CMS deve ter `.catch(() => null)` ou array vazio para impedir _crash_ do servidor local.

---

## II. TOKENS DE DESIGN (CONTEXTUAIS)

_Regras visuais ditadas pela POLARIDADE da seção (Dark/Light Mode). Nunca assuma valores absolutos._

### 1. Polaridade de Cor

Antes de alterar cores, verifique se o container pai é uma "Dark Section" ou "Light Section".

- **Dark Sections (Ex: Hero, Preloader, Pacotes):**
  - Fundo: Variáveis obscuras (`--color-overlay` ou `#080D0B`).
  - Textos/Contornos: Claros para contraste (`--color-text`, `#F4F4F4` ou `#FFFFFF`).
- **Light Sections (Ex: Conteúdo Editorial):**
  - Fundo: Off-whites sofisticados (`#F5F5F7` ou `#FDFDFD`).
  - Textos/Contornos: Grafite/Preto (`#0D0D0D` ou `#1A1B1A`).

### 2. Tipografia e Escala

- **Fontes (Imutável):** Montserrat (Sans) + Playfair Display (Serif) via `var(--font-sans)`.
- **Hierarquia:** Títulos de seção imersivos. Labels/Subtítulos com respiro (uppercase, 0.75rem, letter-spacing 0.05em).

### 3. Movimento e Estética (Awwwards Style)

- **Glassmorphism Purista:** Apenas blur e translúcidos. Nunca use bordas opacas ou sombras pesadas.
- **Transições:** Nunca use `transition: all`. Movimentos devem usar inércia (GSAP) ou bezier sofisticado (`ease: cubic-bezier(0.19, 1, 0.22, 1)`).
- **Iluminação Tipográfica:** Em seções com fundo estático, a percepção de rolagem deve ser dada por textos mudando de grafite para branco (`scrollTrigger` com `scrub`), atuando como motor visual.

---

## III. FORMATO DE RESPOSTA ESPERADO

Antes de executar código, responda estritamente neste formato:

1.  **Diagnóstico Físico** — O que quebrou e a matemática do porquê.
2.  **Opções de Engenharia** — 2 a 3 abordagens mecânicas.
3.  **Recomendação** — A melhor abordagem (Performance/Awwwards).
4.  **Aguardar Confirmação.**

_(Se houver mudanças estruturais, registre o estado funcional anterior no log de sessão)._
