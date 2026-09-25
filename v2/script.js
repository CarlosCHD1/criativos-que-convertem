/**
 * ============================================================================
 * CURSO MIRA — CRIATIVOS QUE CONVERTEM (CQC)
 * Frontend Controller & Interaction Engine
 * ============================================================================
 */

(function () {
  'use strict';

  // --- 1. Video Sound & Playback Controller (Hero) ---
  const vslVideo = document.getElementById('vslVideo');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundMutedIcon = document.getElementById('soundMutedIcon');
  const soundActiveIcon = document.getElementById('soundActiveIcon');
  const soundBtnText = document.getElementById('soundBtnText');

  if (vslVideo && soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      if (vslVideo.muted) {
        vslVideo.muted = false;
        vslVideo.play().catch(() => {});
        if (soundMutedIcon) soundMutedIcon.style.display = 'none';
        if (soundActiveIcon) soundActiveIcon.style.display = 'inline-block';
        if (soundBtnText) soundBtnText.textContent = 'Som ativado';
        soundToggleBtn.setAttribute('aria-label', 'Desativar som do vídeo');
      } else {
        vslVideo.muted = true;
        if (soundMutedIcon) soundMutedIcon.style.display = 'inline-block';
        if (soundActiveIcon) soundActiveIcon.style.display = 'none';
        if (soundBtnText) soundBtnText.textContent = 'Clique para ouvir';
        soundToggleBtn.setAttribute('aria-label', 'Ativar som do vídeo');
      }
    });

    // Auto-tenta iniciar em mudo de forma segura
    vslVideo.play().catch(() => {
      // Ignora bloqueios normais de autoplay do navegador
    });
  }

  // --- 2. Interactive Examples Category Filter ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const exampleCards = document.querySelectorAll('.example-card');

  if (filterBtns.length > 0 && exampleCards.length > 0) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const filter = btn.getAttribute('data-filter');

        exampleCards.forEach((card) => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // --- 3. Accessible FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question-btn');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Fecha os outros para manter foco e leitura limpa
      faqItems.forEach((other) => {
        other.classList.remove('active');
        const otherBtn = other.querySelector('.faq-question-btn');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      // Alterna estado do item atual
      if (!isOpen) {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // --- 4. Transparent Checkout Flow (Com Preservação de UTMs e Parâmetros) ---
  const checkoutBtn = document.getElementById('checkoutBtn');
  const modalOverlay = document.getElementById('checkoutPendingModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  let lastFocusedElement = null;

  function openPendingModal() {
    if (!modalOverlay) return;
    lastFocusedElement = document.activeElement;
    modalOverlay.classList.add('is-open');
    if (modalCloseBtn) modalCloseBtn.focus();
  }

  function closePendingModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-open');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closePendingModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closePendingModal();
    });
  }

  // Fechamento de modal acessível via tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('is-open')) {
      closePendingModal();
    }
  });

  // Handler de Checkout Conectado à Configuração
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const config = window.MIRA_CONFIG || {};
      const checkoutUrl = (config.checkoutUrl || '').trim();

      // Se existir uma URL real de checkout configurada
      if (checkoutUrl && checkoutUrl !== '#' && checkoutUrl.startsWith('http')) {
        // Disparo oficial de InitiateCheckout
        if (window.MIRA_TRACKING && typeof window.MIRA_TRACKING.trackInitiateCheckout === 'function') {
          window.MIRA_TRACKING.trackInitiateCheckout({
            value: config.priceCash || 297.00,
            currency: 'BRL'
          });
        }

        // Anexar parâmetros de campanha (UTMs e fbclid) para o checkout
        try {
          const currentParams = new URLSearchParams(window.location.search);
          const targetUrl = new URL(checkoutUrl);

          currentParams.forEach((value, key) => {
            if (!targetUrl.searchParams.has(key)) {
              targetUrl.searchParams.set(key, value);
            }
          });

          window.location.href = targetUrl.toString();
        } catch (err) {
          window.location.href = checkoutUrl;
        }
      } else {
        // Sem URL real configurada: Exibe modal transparente e explicativo (sem falsas aprovações)
        openPendingModal();
      }
    });
  }

  // --- 5. Smooth Scroll para Âncoras ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

})();
