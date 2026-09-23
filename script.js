/* ==========================================================================
   CURSO MIRA — CRIATIVOS QUE CONVERTEM
   Interactivity & Micro-animations
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Sticky Navbar on Scroll (Passive & Cached State) ---
  const navbar = document.querySelector('.navbar');
  let isNavScrolled = false;
  if (navbar) {
    window.addEventListener('scroll', () => {
      const shouldScroll = window.scrollY > 40;
      if (shouldScroll !== isNavScrolled) {
        isNavScrolled = shouldScroll;
        navbar.classList.toggle('scrolled', isNavScrolled);
      }
    }, { passive: true });
  }

  // --- 2. Mobile Menu Toggle ---
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
      });
    });
  }

  // --- 3. Navigation Active Link Tracking (IntersectionObserver - Zero Forced Reflows) ---
  const navLinks = document.querySelectorAll('.nav-link');
  if (navLinks.length > 0 && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0.05 });

    document.querySelectorAll('section[id], header[id]').forEach(sec => sectionObserver.observe(sec));
  }

  // --- 4. Video Modal Handlers ---
  const videoModal = document.getElementById('videoModal');
  const closeVideoModal = document.getElementById('closeVideoModal');
  const openVideoBtns = document.querySelectorAll('.open-video-modal');

  openVideoBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      videoModal.classList.add('active');
      videoModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  if (closeVideoModal) {
    closeVideoModal.addEventListener('click', () => {
      videoModal.classList.remove('active');
      videoModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  }

  // Video Play Button Simulation
  const playPreviewTrigger = document.getElementById('playPreviewTrigger');
  const playerProgress = document.querySelector('.player-progress');

  if (playPreviewTrigger && playerProgress) {
    let isPlaying = false;
    let progressInterval;

    playPreviewTrigger.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        playPreviewTrigger.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        `;
        let curWidth = 38;
        progressInterval = setInterval(() => {
          curWidth += 1;
          if (curWidth > 100) curWidth = 0;
          playerProgress.style.width = curWidth + '%';
        }, 120);
      } else {
        playPreviewTrigger.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        `;
        clearInterval(progressInterval);
      }
    });
  }

  // Close modal when clicking on backdrop
  window.addEventListener('click', (e) => {
    if (e.target === videoModal) {
      videoModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    if (e.target === checkoutModal) {
      checkoutModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Link inside video modal that scrolls to offer
  const closeModalAndScroll = document.querySelector('.close-modal-and-scroll');
  if (closeModalAndScroll) {
    closeModalAndScroll.addEventListener('click', () => {
      videoModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // --- 5. Checkout Modal Handlers ---
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutModal = document.getElementById('closeCheckoutModal');
  const openCheckoutBtns = document.querySelectorAll('.open-checkout-modal');

  openCheckoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      checkoutModal.classList.add('active');
      checkoutModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  if (closeCheckoutModal) {
    closeCheckoutModal.addEventListener('click', () => {
      checkoutModal.classList.remove('active');
      checkoutModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  }

  // Checkout Form Submission
  window.handleCheckoutSubmit = function() {
    const name = document.getElementById('leadName').value;
    const email = document.getElementById('leadEmail').value;
    const phone = document.getElementById('leadPhone').value;

    // Disparo Unificado Meta Pixel + CAPI (com Advanced Matching SHA-256)
    if (window.MIRA_TRACKING && typeof window.MIRA_TRACKING.trackLead === 'function') {
      window.MIRA_TRACKING.trackLead({
        name: name,
        email: email,
        phone: phone
      });
    }

    const modalContent = document.querySelector('.checkout-modal-content');
    modalContent.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="width: 70px; height: 70px; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 style="font-size: 2rem; margin-bottom: 12px; color: #fff;">Inscrição Pré-Aprovada!</h3>
        <p style="color: #b3b2c0; font-size: 1rem; margin-bottom: 24px; line-height: 1.6;">
          Obrigado, <strong>${name}</strong>!<br>
          Enviamos os dados de acesso e a chave exclusiva do <strong>MIRA Radar</strong> para <strong>${email}</strong>.
        </p>
        <button onclick="location.reload()" class="btn-primary" style="margin: 0 auto;">
          <span>Concluir e Ir para Área de Membros</span>
        </button>
      </div>
    `;
  };

  // --- 6. Interactive Examples Category Filter ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const creativeCards = document.querySelectorAll('.creative-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      creativeCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'block';
          setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => { card.style.display = 'none'; }, 200);
        }
      });
    });
  });

  // --- 7. FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other items
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });

      // Toggle current item
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // --- 8. Unified Smooth Scroll & Mouse Parallax Engine (Smart RAF with Auto-Pause) ---
  const heroSection = document.querySelector('.hero-section');
  const heroVisual = document.getElementById('heroVisual');
  const heroBgGif = document.getElementById('heroBgGif');
  const heroDotsPattern = document.getElementById('heroDotsPattern');
  const phoneWrapper = document.querySelector('.phone-mockup-wrapper');
  const floatingCards = document.querySelectorAll('.floating-card');

  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;
  let currentScrollY = window.scrollY || 0;
  let isMouseInsideHero = false;
  let isHeroVisible = true;
  let isParallaxRunning = false;

  // Track mouse coordinates inside hero
  if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      isMouseInsideHero = true;
      const rect = heroSection.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to +1
      targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    heroSection.addEventListener('mouseleave', () => {
      isMouseInsideHero = false;
      targetMouseX = 0;
      targetMouseY = 0;
    }, { passive: true });
  }

  // Animation Frame Loop for 60fps / 120fps Silky Smooth Parallax
  function renderParallax() {
    if (!isParallaxRunning) return;

    const rawScrollY = window.scrollY || 0;
    const heroHeight = heroSection ? heroSection.offsetHeight : 800;

    // Smooth lerp interpolation for mouse and scroll
    currentMouseX += (targetMouseX - currentMouseX) * 0.08;
    currentMouseY += (targetMouseY - currentMouseY) * 0.08;
    currentScrollY += (rawScrollY - currentScrollY) * 0.12;

    // Only update elements when hero is within or near viewport
    if (currentScrollY < heroHeight + 300) {
      
      // 1. Motion Background Parallax: Moves with scroll and reacts to mouse (Desktop only)
      if (heroBgGif) {
        if (window.innerWidth > 768) {
          const bgShiftY = currentScrollY * 0.42; // Scroll downward movement
          const bgMouseX = currentMouseX * -25;    // Mouse opposite horizontal sway
          const bgMouseY = currentMouseY * -16;    // Mouse vertical sway
          const bgScale = 1.06 + Math.min(currentScrollY * 0.00035, 0.10); // Subtle dynamic camera push
          heroBgGif.style.transform = `translate3d(${bgMouseX.toFixed(2)}px, ${(bgShiftY + bgMouseY).toFixed(2)}px, 0) scale(${bgScale.toFixed(4)})`;
        } else {
          heroBgGif.style.transform = '';
        }
      }

      // 1b. Dotted Texture Parallax: Subtle secondary depth layer (Desktop only)
      if (heroDotsPattern) {
        if (window.innerWidth > 768) {
          const dotsShiftY = currentScrollY * 0.20;
          const dotsMouseX = currentMouseX * -10;
          const dotsMouseY = currentMouseY * -7;
          heroDotsPattern.style.transform = `translate3d(${dotsMouseX.toFixed(2)}px, ${(dotsShiftY + dotsMouseY).toFixed(2)}px, 0)`;
        } else {
          heroDotsPattern.style.transform = '';
        }
      }

      // 2. Coluna de Criativos à Direita (Stream Contínuo) — Parallax suave de profundidade
      if (window.innerWidth > 992) {
        const streamWrapper = document.getElementById('creativesStreamWrapper');
        if (streamWrapper) {
          const swX = currentMouseX * 10;
          const swY = currentMouseY * 8 - currentScrollY * 0.08;
          streamWrapper.style.transform = `translate3d(${swX.toFixed(2)}px, calc(-50% + ${swY.toFixed(2)}px), 0)`;
        }
      }

      // 3. Central Phone Mockup 3D Tilt (Desktop only)
      if (phoneWrapper) {
        if (window.innerWidth > 992) {
          const tiltY = currentMouseX * 7 - 3;
          const tiltX = -currentMouseY * 7 + 4;
          const phoneScrollDrift = -10 + currentScrollY * -0.06;
          phoneWrapper.style.transform = `rotateY(${tiltY.toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg) rotateZ(-2deg) translateY(${phoneScrollDrift.toFixed(2)}px)`;
        } else {
          phoneWrapper.style.transform = '';
        }
      }
    }

    if (isHeroVisible && !document.hidden) {
      requestAnimationFrame(renderParallax);
    } else {
      isParallaxRunning = false;
    }
  }

  function resumeParallax() {
    if (window.innerWidth <= 768) return; // Zero overhead em dispositivos móveis
    if (!isParallaxRunning && isHeroVisible && !document.hidden) {
      isParallaxRunning = true;
      requestAnimationFrame(renderParallax);
    }
  }

  // Observer to pause RAF loop when Hero is offscreen
  if (heroSection && 'IntersectionObserver' in window) {
    const heroVisibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isHeroVisible = entry.isIntersecting;
        if (isHeroVisible) {
          resumeParallax();
        }
      });
    }, { threshold: 0.02 });
    heroVisibilityObserver.observe(heroSection);
  }

  // Pause on inactive tab, resume on active tab
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isHeroVisible) {
      resumeParallax();
    }
  });

  // Start the smart parallax loop
  resumeParallax();

  // --- 9. VSL VIDEO PLAYER INSIDE PHONE MASK (ANTI-SKIP & ANTI-ACCELERATION) ---
  initVSLPhonePlayer();

});

/* ==========================================================================
   VSL PHONE PLAYER ENGINE (YouTube Iframe API)
   Trava absoluta contra pular, avançar ou acelerar o vídeo
   ========================================================================== */
let vslPlayer = null;
let maxAllowedTime = 0;
let isSoundActive = false;
let hasStartedWithAudio = false;
let vslWatchInterval = null;

function initVSLPhonePlayer() {
  const vslNativeVideo = document.getElementById('vslNativeVideo');
  const vslUnmutePrompt = document.getElementById('vslUnmutePrompt');
  const vslSoundBtn = document.getElementById('vslSoundBtn');
  const soundIconMuted = vslSoundBtn ? vslSoundBtn.querySelector('.sound-icon-muted') : null;
  const soundIconActive = vslSoundBtn ? vslSoundBtn.querySelector('.sound-icon-active') : null;
  const vslProgressFill = document.getElementById('vslProgressFill');
  const heroVisual = document.getElementById('heroVisual');

  if (!vslNativeVideo) return;

  // Atualiza os ícones do botão de som
  function updateSoundIcons(isMuted) {
    if (soundIconMuted && soundIconActive) {
      soundIconMuted.style.display = isMuted ? 'block' : 'none';
      soundIconActive.style.display = isMuted ? 'none' : 'block';
    }
  }

  // Oculta o banner de desmutar para sempre
  function dismissPrompt() {
    if (vslUnmutePrompt) {
      vslUnmutePrompt.classList.add('dismissed', 'hidden');
    }
    if (heroVisual) {
      heroVisual.classList.add('vsl-cinema-mode');
    }
    try {
      sessionStorage.setItem('mira_vsl_watched', 'true');
    } catch (e) {}
  }

  // Inicia o vídeo com som ao clicar no banner
  function startVideoWithSound() {
    dismissPrompt();
    vslNativeVideo.muted = false;
    vslNativeVideo.volume = 1.0;
    const playPromise = vslNativeVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Se o navegador barrar o unmuting autoplay, reproduz silenciado
        vslNativeVideo.muted = true;
        vslNativeVideo.play().catch(() => {});
      });
    }
    updateSoundIcons(vslNativeVideo.muted);
  }

  // Se já assistiu nesta sessão, oculta o prompt imediatamente
  try {
    if (sessionStorage.getItem('mira_vsl_watched') === 'true') {
      dismissPrompt();
    }
  } catch (e) {}

  // Autoplay silenciado de fundo (padrão VSL)
  vslNativeVideo.play().catch(() => {
    // Tenta novamente na primeira interação do usuário de forma passiva
    const unlockPlay = () => {
      vslNativeVideo.play().catch(() => {});
      document.removeEventListener('click', unlockPlay);
      document.removeEventListener('touchstart', unlockPlay);
    };
    document.addEventListener('click', unlockPlay, { once: true, passive: true });
    document.addEventListener('touchstart', unlockPlay, { once: true, passive: true });
  });

  // Clique no banner "SEU VÍDEO JÁ COMEÇOU - CLIQUE AQUI PARA ASSISTIR"
  if (vslUnmutePrompt) {
    vslUnmutePrompt.addEventListener('click', (e) => {
      e.stopPropagation();
      startVideoWithSound();
    });
  }

  // Botão de som no topo da moldura do celular
  if (vslSoundBtn) {
    vslSoundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPrompt();
      vslNativeVideo.muted = !vslNativeVideo.muted;
      if (!vslNativeVideo.muted && vslNativeVideo.paused) {
        vslNativeVideo.play().catch(() => {});
      }
      updateSoundIcons(vslNativeVideo.muted);
    });
  }

  // Sincronização em tempo real da barra de progresso do VSL
  vslNativeVideo.addEventListener('timeupdate', () => {
    if (vslProgressFill && vslNativeVideo.duration) {
      const pct = (vslNativeVideo.currentTime / vslNativeVideo.duration) * 100;
      vslProgressFill.style.width = pct + '%';
    }
  });

  // Loop contínuo e suave
  vslNativeVideo.addEventListener('ended', () => {
    vslNativeVideo.currentTime = 0;
    vslNativeVideo.play().catch(() => {});
  });
}

  // ==========================================================================
  // 11. COLUNA DE CRIATIVOS EM SCROLL INFINITO (DIREITA DO CELULAR)
  // - Movimento contínuo e suave para cima
  // - Detecção dinâmica em tempo real do criativo no centro
  // - Destaque com contorno laranja neon no card centralizado
  // - Pausa suave no hover e suporte a toque
  // ==========================================================================
  function initCreativesInfiniteStream() {
    if (window.innerWidth <= 768) return; // No mobile a coluna fica oculta; poupa 100% de CPU/clones
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // Respeita preferência de acessibilidade
    const streamViewport = document.getElementById('creativesStreamViewport');
    const streamTrack = document.getElementById('creativesStreamTrack');
    if (!streamViewport || !streamTrack) return;

    let isHovered = false;
    let scrollY = 0;
    const speed = 0.85; // Velocidade fluida (~50px/segundo a 60fps)
    let animationFrameId = null;

    // Duplicar a lista 1 única vez para garantir fluxo contínuo e sem nós desnecessários
    const originalCards = Array.from(streamTrack.children);
    if (originalCards.length === 0) return;

    // Bloco único de clones (16 cards totais no DOM em vez de 24)
    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.classList.add('stream-clone');
      clone.classList.remove('is-selected');
      streamTrack.appendChild(clone);
    });

    // Pausa no hover para permitir leitura / inspeção
    streamViewport.addEventListener('mouseenter', () => {
      isHovered = true;
    });

    streamViewport.addEventListener('mouseleave', () => {
      isHovered = false;
    });

    // Toque no mobile
    streamViewport.addEventListener('touchstart', () => {
      isHovered = true;
    }, { passive: true });

    streamViewport.addEventListener('touchend', () => {
      setTimeout(() => { isHovered = false; }, 1200);
    }, { passive: true });

    // Permite clicar em qualquer card para focar
    streamTrack.addEventListener('click', (e) => {
      const card = e.target.closest('.stream-card');
      if (card) {
        Array.from(streamTrack.children).forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
      }
    });

    // Calcula a altura de 1 bloco completo original (cards + espaçamentos)
    function calculateSingleSetHeight() {
      let totalH = 0;
      const gap = 16;
      for (let i = 0; i < originalCards.length; i++) {
        totalH += (originalCards[i].offsetHeight || 155) + gap;
      }
      return totalH > 0 ? totalH : 1360;
    }

    let singleSetHeight = calculateSingleSetHeight();

    window.addEventListener('resize', () => {
      singleSetHeight = calculateSingleSetHeight();
    });

    window.addEventListener('load', () => {
      singleSetHeight = calculateSingleSetHeight();
    });

    // Otimização de Performance: Interrompe o rAF quando o hero estiver fora da tela
    let isStreamVisible = true;
    if ('IntersectionObserver' in window) {
      const streamObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isStreamVisible = entry.isIntersecting;
          if (isStreamVisible && !animationFrameId) {
            animationFrameId = requestAnimationFrame(loopStream);
          }
        });
      }, { threshold: 0.05 });
      streamObserver.observe(streamViewport);
    }

    // Loop contínuo a 60fps / 120fps via requestAnimationFrame
    function loopStream() {
      if (!isStreamVisible) {
        animationFrameId = null;
        return; // Pausa completa para economizar 100% de CPU/GPU fora de tela
      }

      if (!isHovered && !document.hidden) {
        scrollY += speed;
        // Reinício perfeitamente contínuo e sem saltos (seamless loop)
        if (scrollY >= singleSetHeight) {
          scrollY -= singleSetHeight;
        }
        streamTrack.style.transform = `translate3d(0, -${scrollY.toFixed(2)}px, 0)`;
      }

      // Detecção em tempo real do card no centro da coluna
      const vpRect = streamViewport.getBoundingClientRect();
      const vpCenterY = vpRect.top + vpRect.height / 2;

      const allCards = streamTrack.children;
      let closestCard = null;
      let minDistance = Infinity;

      for (let i = 0; i < allCards.length; i++) {
        const card = allCards[i];
        const cardRect = card.getBoundingClientRect();

        // Otimização: ignora cards completamente fora da área de visão
        if (cardRect.bottom < vpRect.top - 20 || cardRect.top > vpRect.bottom + 20) {
          if (card.classList.contains('is-selected')) {
            card.classList.remove('is-selected');
          }
          continue;
        }

        const cardCenterY = cardRect.top + cardRect.height / 2;
        const dist = Math.abs(cardCenterY - vpCenterY);

        if (dist < minDistance) {
          minDistance = dist;
          closestCard = card;
        }
      }

      // O card mais próximo do centro (dentro da zona central) recebe contorno laranja neon
      const focalZone = closestCard ? (closestCard.offsetHeight * 0.72) : 85;

      for (let i = 0; i < allCards.length; i++) {
        const card = allCards[i];
        if (card === closestCard && minDistance < focalZone) {
          if (!card.classList.contains('is-selected')) {
            card.classList.add('is-selected');
          }
        } else {
          if (card.classList.contains('is-selected')) {
            card.classList.remove('is-selected');
          }
        }
      }

      animationFrameId = requestAnimationFrame(loopStream);
    }

    // Inicia o motor
    animationFrameId = requestAnimationFrame(loopStream);
  }

  initCreativesInfiniteStream();

// Global hook for YouTube Iframe API (when running on HTTP/HTTPS)
window.onYouTubeIframeAPIReady = function() {
  if (!window.location.protocol.startsWith('http')) {
    return;
  }

  const iframe = document.getElementById('vslDirectIframe');
  if (!iframe) return;

  try {
    vslPlayer = new YT.Player('vslDirectIframe', {
      events: {
        onReady: (event) => {
          try {
            event.target.playVideo();
            startAntiSkipEngine();
          } catch (err) {}
        },
        onPlaybackRateChange: (event) => {
          if (event.data !== 1) event.target.setPlaybackRate(1);
        },
        onError: (event) => {
          console.warn('YouTube VSL notice:', event.data);
        }
      }
    });
  } catch (err) {
    console.warn('YT.Player note:', err);
  }
};

/* Motor de Proteção Anti-Pulo (Anti-Skip) e Anti-Aceleração */
function startAntiSkipEngine() {
  if (vslWatchInterval) clearInterval(vslWatchInterval);

  const vslProgressFill = document.getElementById('vslProgressFill');

  vslWatchInterval = setInterval(() => {
    if (!vslPlayer || typeof vslPlayer.getCurrentTime !== 'function') return;

    try {
      const curTime = vslPlayer.getCurrentTime();
      const duration = vslPlayer.getDuration() || 60;

      // 1. Bloqueio de Aceleração (Rate Lock)
      if (typeof vslPlayer.getPlaybackRate === 'function') {
        if (vslPlayer.getPlaybackRate() !== 1) {
          vslPlayer.setPlaybackRate(1);
        }
      }

      // 2. Bloqueio de Avanço / Pulo (Skip Lock)
      // Se o tempo pular para frente além do avanço natural (+ 1.5s de tolerância de frame)
      if (curTime > maxAllowedTime + 1.5) {
        // Força retorno ao tempo máximo assistido
        vslPlayer.seekTo(maxAllowedTime, true);
      } else if (curTime > maxAllowedTime) {
        // Avanço natural aceito
        maxAllowedTime = curTime;
      }

      // Se o vídeo reiniciar / estiver em loop
      if (curTime < 1 && maxAllowedTime > 5) {
        maxAllowedTime = curTime;
      }

      // 3. Atualização da Barra de Progresso Apenas Visual (Read-only) e Rastreamento de Retenção
      if (vslProgressFill) {
        const pct = Math.min(100, (curTime / duration) * 100);
        vslProgressFill.style.width = pct + '%';

        // Disparo de Eventos de Clientes Quentes (VSL Engagement)
        if (window.MIRA_TRACKING && typeof window.MIRA_TRACKING.trackVSLProgress === 'function') {
          if (pct >= 90) {
            window.MIRA_TRACKING.trackVSLProgress(90);
          } else if (pct >= 75) {
            window.MIRA_TRACKING.trackVSLProgress(75);
          } else if (pct >= 50) {
            window.MIRA_TRACKING.trackVSLProgress(50);
          } else if (pct >= 25) {
            window.MIRA_TRACKING.trackVSLProgress(25);
          }
        }
      }
    } catch (e) {
      // Ignore transient errors while loading
    }
  }, 250);
}

