/**
 * ============================================================================
 * MIRA TRACKING ENGINE — META PIXEL + CONVERSIONS API (CAPI)
 * Desenvolvido para máxima taxa de correspondência (Event Match Quality)
 * e alimentação do algoritmo com Compradores e Leads Quentes.
 * ============================================================================
 */

(function(window, document) {
  'use strict';

  // Configurações globais (Pode ser sobrescrito antes da chamada via window.MIRA_CONFIG)
  const CONFIG = Object.assign({
    pixelId: 'YOUR_PIXEL_ID', // Será substituído pelo ID real do usuário
    capiEndpoint: '/api/meta-capi',
    currency: 'BRL',
    productValue: 297.00,
    enableConsoleLog: true
  }, window.MIRA_CONFIG || {});

  // Estado interno
  const state = {
    initialized: false,
    fbp: null,
    fbc: null,
    utms: {},
    trackedEvents: new Set()
  };

  /**
   * Utilitários de Cookies
   */
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, value, days = 90) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax`;
  }

  /**
   * Captura fbclid e monta _fbc conforme a documentação oficial da Meta
   * Formato: fb.1.TIMESTAMP.FBCLID
   */
  function setupMetaCookies() {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');

    if (fbclid) {
      const fbcValue = `fb.1.${Date.now()}.${fbclid}`;
      setCookie('_fbc', fbcValue, 90);
      state.fbc = fbcValue;
    } else {
      state.fbc = getCookie('_fbc');
    }

    state.fbp = getCookie('_fbp');

    // Captura UTMs
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {
      const val = urlParams.get(param);
      if (val) {
        state.utms[param] = val;
        try { sessionStorage.setItem(param, val); } catch (e) {}
      } else {
        try {
          const stored = sessionStorage.getItem(param);
          if (stored) state.utms[param] = stored;
        } catch (e) {}
      }
    });
  }

  /**
   * Gerador de Event ID único para deduplicação perfeita Browser vs Server
   */
  function generateEventId(eventName) {
    const rand = Math.random().toString(36).substring(2, 10);
    return `mira_${eventName.toLowerCase()}_${Date.now()}_${rand}`;
  }

  /**
   * Inicializa o Meta Pixel base no DOM caso não exista
   */
  function initBasePixel(pixelId) {
    if (window.fbq) return;

    /* eslint-disable */
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    if (pixelId && pixelId !== 'YOUR_PIXEL_ID') {
      window.fbq('init', pixelId);
    }
  }

  /**
   * Disparo Unificado: Browser (Pixel) + Server-Side (CAPI) com o mesmo event_id
   */
  async function trackUnified(eventName, customData = {}, userData = {}, isCustomEvent = false) {
    const eventId = generateEventId(eventName);
    const pixelId = CONFIG.pixelId;

    // Atualiza cookies mais recentes
    state.fbp = getCookie('_fbp') || state.fbp;
    state.fbc = getCookie('_fbc') || state.fbc;

    const enrichedUserData = Object.assign({
      fbp: state.fbp,
      fbc: state.fbc,
      client_user_agent: navigator.userAgent
    }, userData);

    const enrichedCustomData = Object.assign({
      ...state.utms,
      page_url: window.location.href,
      page_title: document.title
    }, customData);

    // 1. DISPARO BROWSER (Meta Pixel)
    if (typeof window.fbq === 'function' && pixelId && pixelId !== 'YOUR_PIXEL_ID') {
      try {
        if (isCustomEvent) {
          window.fbq('trackCustom', eventName, enrichedCustomData, { eventID: eventId });
        } else {
          window.fbq('track', eventName, enrichedCustomData, { eventID: eventId });
        }
      } catch (err) {
        console.warn('[MIRA Tracking] Pixel Error:', err);
      }
    }

    if (CONFIG.enableConsoleLog) {
      console.log(`%c[MIRA Tracking] 🚀 Evento: ${eventName}`, 'color: #ff4500; font-weight: bold;', {
        eventId,
        customData: enrichedCustomData,
        userData: enrichedUserData
      });
    }

    // 2. DISPARO SERVER-SIDE (Meta CAPI via Vercel Endpoint)
    try {
      const payload = {
        pixel_id: pixelId !== 'YOUR_PIXEL_ID' ? pixelId : undefined,
        event_name: eventName,
        event_id: eventId,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: window.location.href,
        user_data: enrichedUserData,
        custom_data: enrichedCustomData
      };

      if (navigator.sendBeacon && !userData.em) {
        // Envio rápido em segundo plano
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(CONFIG.capiEndpoint, blob);
      } else {
        // Fetch comum para garantir retorno
        fetch(CONFIG.capiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).then(res => res.json()).catch(() => {});
      }
    } catch (e) {
      // Ignora falhas de rede para não travar a experiência do usuário
    }

    return eventId;
  }

  /**
   * Monitoramento de Clientes Quentes: Scroll Depth (50%, 75%, 90%)
   */
  function initScrollDepthTracking() {
    let maxScroll = 0;
    const thresholds = [50, 75, 90];

    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const b = document.body;
      const st = 'scrollTop';
      const sh = 'scrollHeight';

      const percent = Math.floor(
        ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100
      );

      if (percent > maxScroll) {
        maxScroll = percent;
        thresholds.forEach(t => {
          const key = `scroll_${t}`;
          if (percent >= t && !state.trackedEvents.has(key)) {
            state.trackedEvents.add(key);
            trackUnified(`ScrollDepth_${t}`, { scroll_percentage: t }, {}, true);
          }
        });
      }
    }, { passive: true });
  }

  /**
   * Monitoramento de Clientes Quentes: Tempo na Página (60s, 120s, 180s)
   */
  function initTimeOnPageTracking() {
    const intervals = [
      { seconds: 60, name: 'TimeOnPage_1Min' },
      { seconds: 120, name: 'TimeOnPage_2Min_HotLead' },
      { seconds: 180, name: 'TimeOnPage_3Min_VIP' }
    ];

    intervals.forEach(item => {
      setTimeout(() => {
        if (!state.trackedEvents.has(item.name)) {
          state.trackedEvents.add(item.name);
          trackUnified(item.name, { duration_seconds: item.seconds }, {}, true);
        }
      }, item.seconds * 1000);
    });
  }

  /**
   * Monitoramento de Cliques em CTAs de Compra (InitiateCheckout)
   */
  function initCtaTracking() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const isCheckoutBtn = (
        target.classList.contains('hero-btn-main') ||
        target.classList.contains('nav-cta') ||
        target.classList.contains('open-checkout-modal') ||
        target.classList.contains('close-modal-and-scroll') ||
        href.includes('#oferta') ||
        target.textContent.toLowerCase().includes('quero dominar') ||
        target.textContent.toLowerCase().includes('inscrição')
      );

      if (isCheckoutBtn) {
        trackUnified('InitiateCheckout', {
          content_name: 'Curso MIRA — Criativos que Convertem',
          content_category: 'Curso Online',
          content_ids: ['curso_mira_cqc'],
          value: CONFIG.productValue,
          currency: CONFIG.currency,
          button_text: target.innerText?.trim().slice(0, 40)
        });
      }
    });
  }

  /**
   * API Pública do MIRA Tracking
   */
  window.MIRA_TRACKING = {
    init: function(customConfig) {
      if (customConfig) Object.assign(CONFIG, customConfig);
      setupMetaCookies();
      initBasePixel(CONFIG.pixelId);

      // Dispara PageView inicial
      trackUnified('PageView');

      // Inicia sensores de clientes quentes
      initScrollDepthTracking();
      initTimeOnPageTracking();
      initCtaTracking();

      state.initialized = true;
    },

    setPixelId: function(pixelId) {
      CONFIG.pixelId = pixelId;
      if (window.fbq && pixelId && pixelId !== 'YOUR_PIXEL_ID') {
        window.fbq('init', pixelId);
      }
    },

    // Rastreamento explícito de Lead (ao preencher formulário)
    trackLead: function(leadInfo = {}) {
      const nameParts = (leadInfo.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const userData = {
        email: leadInfo.email,
        phone: leadInfo.phone,
        first_name: firstName,
        last_name: lastName
      };

      const customData = {
        content_name: 'Inscrição Pré-Aprovada Curso MIRA',
        status: 'Lead_Capturado',
        value: CONFIG.productValue,
        currency: CONFIG.currency
      };

      return trackUnified('Lead', customData, userData);
    },

    // Rastreamento de Início de Checkout
    trackInitiateCheckout: function(extraData = {}) {
      return trackUnified('InitiateCheckout', Object.assign({
        content_name: 'Curso MIRA — Criativos que Convertem',
        content_ids: ['curso_mira_cqc'],
        value: CONFIG.productValue,
        currency: CONFIG.currency
      }, extraData));
    },

    // Rastreamento de marcos de VSL / Vídeo
    trackVSLProgress: function(percentage) {
      const key = `vsl_${percentage}`;
      if (state.trackedEvents.has(key)) return;
      state.trackedEvents.add(key);

      const eventName = percentage >= 75 ? 'VSL_Pitch_Reached' : `VSL_Watched_${percentage}`;
      trackUnified(eventName, { video_progress: percentage }, {}, true);
    },

    // Disparo genérico customizado
    trackCustom: function(eventName, customData = {}, userData = {}) {
      return trackUnified(eventName, customData, userData, true);
    },

    // Disparo oficial Meta
    track: function(eventName, customData = {}, userData = {}) {
      return trackUnified(eventName, customData, userData, false);
    }
  };

  // Auto-inicialização quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.MIRA_TRACKING.init());
  } else {
    window.MIRA_TRACKING.init();
  }

})(window, document);
