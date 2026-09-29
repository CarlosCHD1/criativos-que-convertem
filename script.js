(() => {
  'use strict';
  const config = window.MIRA_CONFIG || {};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const safeUrl = value => {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url : null; }
    catch { return null; }
  };

  // Start from the beginning with sound; native controls handle pause and seeking.
  const video = document.getElementById('vslVideo');
  const start = document.getElementById('videoStartBtn');
  const videoError = document.getElementById('videoError');
  if (video && start) {
    video.controls = false;
    start.hidden = false;
    start.addEventListener('click', async () => {
      video.currentTime = 0;
      video.muted = false;
      video.controls = true;
      start.hidden = true;
      try {
        await video.play();
        video.focus();
        window.MIRA_TRACKING?.trackCustom('VSL_Play', { placement: 'hero' });
      } catch {
        video.controls = true;
        start.hidden = false;
        videoError.hidden = false;
      }
    });
    video.addEventListener('error', () => { videoError.hidden = false; });
    video.addEventListener('ended', () => {
      video.controls = false;
      start.querySelector('.play-label').firstChild.textContent = 'Assistir novamente ';
      start.hidden = false;
    });
    video.addEventListener('timeupdate', () => {
      if (!video.duration || video.muted || video.paused) return;
      const percent = video.currentTime / video.duration * 100;
      [25, 50, 75].forEach(mark => { if (percent >= mark) window.MIRA_TRACKING?.trackVSLProgress(mark); });
    });
  }

  const stages = [
    ['Chamar quem vive o problema', '“Seu cliente pediu outro criativo. O que você vai mudar?”', 'A situação é familiar para quem gerencia campanhas. O gancho chama esse público para a conversa.'],
    ['Dar um motivo para continuar', '“Antes de trocar a imagem, descubra qual dúvida está impedindo a pessoa de avançar.”', 'O trecho apresenta outra forma de olhar o problema e prepara o argumento que vem a seguir.'],
    ['Mostrar o valor da solução', '“Com esse argumento, você sabe o que dizer, o que mostrar e qual variação testar.”', 'O benefício aparece no trabalho do dia a dia: tomar decisões com mais clareza.'],
    ['Indicar o próximo passo', '“Conheça o Criativos que Convertem e veja como montar esse processo.”', 'Uma ação simples, coerente com o que o anúncio acabou de apresentar.']
  ];
  const tabs = [...document.querySelectorAll('[data-stage]')];
  const nextStage = document.getElementById('nextStage');
  let activeStage = 0;
  function selectStage(index, focus = false) {
    activeStage = (index + stages.length) % stages.length;
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === activeStage)); tab.tabIndex = i === activeStage ? 0 : -1; });
    document.getElementById('scriptFunction').textContent = stages[activeStage][0];
    document.getElementById('scriptQuote').textContent = stages[activeStage][1];
    document.getElementById('scriptReason').textContent = stages[activeStage][2];
    document.getElementById('script-example').setAttribute('aria-labelledby', tabs[activeStage].id);
    document.getElementById('scriptCount').textContent = `Etapa ${activeStage + 1} de 4`;
    document.getElementById('scriptProgress').style.width = `${(activeStage + 1) * 25}%`;
    nextStage.firstChild.textContent = ['Ver interesse ', 'Ver desejo ', 'Ver ação ', 'Voltar ao gancho '][activeStage];
    if (focus) tabs[activeStage].focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectStage(i));
    tab.addEventListener('keydown', event => {
      const index = { ArrowRight: activeStage + 1, ArrowLeft: activeStage - 1, Home: 0, End: 3 }[event.key];
      if (index === undefined) return;
      event.preventDefault(); selectStage(index, true);
    });
  });
  nextStage?.addEventListener('click', () => selectStage(activeStage + 1));

  const gallery = document.getElementById('creativeGallery');
  const previous = document.getElementById('galleryPrev');
  const next = document.getElementById('galleryNext');
  if (gallery && previous && next) {
    const cards = [...gallery.querySelectorAll('.creative-card')];
    let current = 0;
    const positions = () => cards.map(card => card.offsetLeft - cards[0].offsetLeft);
    const updateGallery = () => {
      const offsets = positions();
      current = offsets.reduce((best, offset, index) => Math.abs(offset - gallery.scrollLeft) < Math.abs(offsets[best] - gallery.scrollLeft) ? index : best, 0);
      if (gallery.scrollWidth > gallery.clientWidth && gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 3) current = cards.length - 1;
      document.getElementById('galleryCount').textContent = `${current + 1} / ${cards.length}`;
      previous.disabled = current === 0; next.disabled = current === cards.length - 1;
    };
    const move = direction => gallery.scrollTo({ left: positions()[Math.max(0, Math.min(cards.length - 1, current + direction))], behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    gallery.addEventListener('scroll', updateGallery, { passive: true });
    gallery.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } });
    window.addEventListener('resize', updateGallery, { passive: true });
    updateGallery();
  }

  const checkout = safeUrl(config.checkoutUrl);
  const checkoutButton = document.getElementById('checkoutBtn');
  const contact = safeUrl(config.contactUrl);
  const brl = value => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (Number.isFinite(Number(config.priceCash))) document.querySelector('[data-price-cash]').textContent = Number(config.priceCash).toLocaleString('pt-BR', { minimumFractionDigits: Number(config.priceCash) % 1 ? 2 : 0 });
  if (config.installmentsCount && config.installmentsValue) document.querySelector('[data-installments]').textContent = `${config.installmentsCount}x de ${brl(config.installmentsValue)}`;
  if (config.installmentsTotal) document.querySelector('[data-installments-total]').textContent = `Total parcelado: ${brl(config.installmentsTotal)}`;
  if (checkout && checkoutButton) {
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => { if (!checkout.searchParams.has(key)) checkout.searchParams.set(key, value); });
    checkoutButton.href = checkout.toString();
    checkoutButton.firstChild.textContent = 'Quero meu acesso ';
    document.getElementById('enrollmentStatus').textContent = 'Inscrições abertas';
    document.getElementById('checkoutNote').textContent = 'Acesso liberado após a confirmação do pagamento.';
    checkoutButton.addEventListener('click', () => window.MIRA_TRACKING?.trackInitiateCheckout({ value: Number(config.priceCash) || 297, currency: 'BRL' }));
  } else if (contact && checkoutButton) {
    checkoutButton.href = contact.toString();
    checkoutButton.addEventListener('click', () => window.MIRA_TRACKING?.trackCustom('Contato_Inscricao', { placement: 'offer' }));
  }

  // Show the mobile shortcut only after the hero, and hide it at the offer.
  const mobileOffer = document.getElementById('mobileOffer');
  const hero = document.getElementById('inicio');
  const offer = document.getElementById('oferta');
  if (mobileOffer && hero && offer && 'IntersectionObserver' in window) {
    let heroPassed = false, offerVisible = false;
    const sync = () => { mobileOffer.hidden = !heroPassed || offerVisible; };
    new IntersectionObserver(entries => { heroPassed = !entries[0].isIntersecting && entries[0].boundingClientRect.bottom < 0; sync(); }, { threshold: 0 }).observe(hero);
    new IntersectionObserver(entries => { offerVisible = entries[0].isIntersecting; sync(); }, { threshold: 0 }).observe(offer);
  }
})();
