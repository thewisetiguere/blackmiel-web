/* ============================================================
   blackmiel — coreografía splash → intro (jingle) → perfiles → app
   GSAP timeline sincronizada con el jingle de 4.1s
   ============================================================ */

(function () {
  'use strict';

  var splash = document.getElementById('splash');
  var splashB = document.getElementById('splashB');
  var btnEnter = document.getElementById('btnEnter');
  var introFlash = document.getElementById('introFlash');
  var profiles = document.getElementById('profiles');
  var app = document.getElementById('app');
  var navLogo = document.getElementById('navLogo');
  var video = document.getElementById('introVideo');

  /* ---------- URLs limpias (History API) ----------
     /nosotros, /portafolio, /contacto son enlaces compartibles: entran
     directo a la sección sin pasar por el splash/intro ni el selector.
     "/" y "/home" sí muestran la experiencia completa. */

  var PATH_TO_SECTION = { '/nosotros': 'nosotros', '/portafolio': 'portafolio', '/contacto': 'contacto' };
  var SECTION_TO_PATH = { nosotros: '/nosotros', portafolio: '/portafolio', contacto: '/contacto' };

  /* ---------- 2 · intro en video (audio incrustado, ~5.5s) ----------
     El video ya trae su propio jingle: se reproduce completo desde el
     inicio al hacer clic, sin cortes ni saltos de tiempo.
  ------------------------------------------------------------------ */

  var videoReady = false;
  var finished = false;

  function markVideoReady() {
    if (videoReady) { return; }
    videoReady = true;
    // primer frame como "portada" (el CSS lo funde sobre la B)
    splash.classList.add('splash--video');
  }

  video.addEventListener('canplaythrough', markVideoReady);

  // si el video ya venía listo (caché/CDN rápido) el evento pudo dispararse
  // antes de registrar el listener: se comprueba el estado directamente
  if (video.readyState >= 3) { markVideoReady(); }

  // doble respaldo de cierre: ended y un temporizador con la duración real
  video.addEventListener('ended', function () {
    if (!finished) { finishIntro(); }
  });

  function finishIntro() {
    finished = true;
    gsap.to(splash, {
      opacity: 0, duration: 0.5, ease: 'power1.inOut',
      onComplete: showProfiles
    });
  }

  btnEnter.addEventListener('click', function () {
    btnEnter.disabled = true;
    gsap.to(btnEnter, { opacity: 0, y: 12, duration: 0.35, ease: 'power1.out' });

    if (videoReady) {
      video.muted = false;
      video.currentTime = 0;
      var pv = video.play();
      if (pv && pv.catch) { pv.catch(fallbackAnimation); }
      // respaldo: temporizador con la duración real del archivo
      setTimeout(function () {
        if (!finished) { finishIntro(); }
      }, (video.duration ? video.duration * 1000 : 6000));
    } else {
      fallbackAnimation();
    }
  });

  /* respaldo: la B tipográfica animada con GSAP si el video no carga */
  function fallbackAnimation() {
    var tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: showProfiles
    });

    tl.set(splashB, { opacity: 1 }, 0) // solo aquí se revela: el video falló
      .to(splashB, { scale: 0.92, duration: 0.55, ease: 'power2.in' }, 0)
      .to(splashB, { scale: 45, duration: 2.4, ease: 'expo.inOut' }, 0.55)
      .to(introFlash, { opacity: 1, duration: 0.28, ease: 'power1.in' }, 2.15)
      .to(introFlash, { opacity: 0, duration: 0.7, ease: 'power2.out' }, 2.5)
      .to(splashB, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 2.6)
      .to(splash, { opacity: 0, duration: 0.7, ease: 'power1.inOut' }, 3.3);
  }

  /* ---------- 3 · selector de perfiles ---------- */

  function showProfiles() {
    splash.classList.remove('screen--visible');
    splash.style.display = 'none';

    profiles.classList.add('screen--visible');
    gsap.fromTo(profiles, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power1.out' });
    gsap.fromTo('.profile',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out', delay: 0.2 }
    );
  }

  document.querySelectorAll('.profile').forEach(function (el) {
    el.addEventListener('click', function () { enterApp(el.dataset.section); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterApp(el.dataset.section); }
    });
  });

  /* ---------- 4 · app principal ---------- */

  function enterApp(sectionName) {
    gsap.to(profiles, {
      opacity: 0,
      duration: 0.45,
      ease: 'power1.in',
      onComplete: function () {
        profiles.classList.remove('screen--visible');
        profiles.style.display = 'none';

        showSection(sectionName);
        app.classList.add('screen--visible');
        gsap.fromTo(app, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power1.out' });
      }
    });
  }

  function showSection(name, opts) {
    opts = opts || {};
    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.toggle('section--active', s.id === 'section-' + name);
    });
    document.querySelectorAll('.navbar__links a').forEach(function (a) {
      a.classList.toggle('active', a.dataset.section === name);
    });
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });

    var active = document.querySelector('.section--active');
    if (active) {
      gsap.fromTo(active, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }

    if (name === 'portafolio') {
      initPortfolioCarousels();
      resumeCarousels();
    } else {
      pauseCarousels();
    }

    if (!opts.skipPush) {
      var path = SECTION_TO_PATH[name] || '/';
      if (location.pathname !== path) {
        history.pushState({ section: name }, '', path);
      }
    }
  }

  document.querySelectorAll('.navbar__links a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      showSection(a.dataset.section);
    });
  });

  // CTA "Iniciar proyecto" en Nosotros → salta a Contacto
  var ctaContacto = document.getElementById('ctaContacto');
  if (ctaContacto) {
    ctaContacto.addEventListener('click', function () { showSection('contacto'); });
  }

  // el logo del navbar vuelve al selector de perfiles
  function backToProfiles() {
    pauseCarousels();
    gsap.to(app, {
      opacity: 0,
      duration: 0.4,
      ease: 'power1.in',
      onComplete: function () {
        app.classList.remove('screen--visible');
        profiles.style.display = 'flex';
        profiles.classList.add('screen--visible');
        gsap.fromTo(profiles, { opacity: 0 }, { opacity: 1, duration: 0.6 });
      }
    });
  }

  navLogo.addEventListener('click', function () {
    if (location.pathname !== '/') { history.pushState({ profiles: true }, '', '/'); }
    backToProfiles();
  });

  // botón "atrás"/"adelante" del navegador
  window.addEventListener('popstate', function () {
    var section = PATH_TO_SECTION[location.pathname];
    if (section) {
      if (!app.classList.contains('screen--visible')) {
        profiles.classList.remove('screen--visible');
        profiles.style.display = 'none';
        app.classList.add('screen--visible');
      }
      showSection(section, { skipPush: true });
    } else if (app.classList.contains('screen--visible')) {
      backToProfiles();
    }
  });

  /* ---------- modal del reel (YouTube, carga solo al abrir) ---------- */

  var REEL_VIDEO_ID = 'you3gtMIt4U';
  var btnPlayReel = document.getElementById('btnPlayReel');
  var reelModal = document.getElementById('reelModal');
  var reelFrame = document.getElementById('reelFrame');
  var reelClose = document.getElementById('reelClose');
  var reelBackdrop = document.getElementById('reelBackdrop');

  function openReel(videoId) {
    reelFrame.innerHTML = '<iframe src="https://www.youtube.com/embed/' + videoId +
      '?autoplay=1&rel=0" title="Reproductor blackmiel" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    reelModal.hidden = false;
  }

  function closeReel() {
    reelModal.hidden = true;
    reelFrame.innerHTML = ''; // detiene la reproducción al cerrar
  }

  // cualquier card de portafolio con data-video abre el mismo modal
  // (delegado en document para que también funcione en los clones del carrusel)
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.card[data-video]');
    if (card) { openReel(card.dataset.video); }
  });

  if (btnPlayReel) {
    btnPlayReel.addEventListener('click', function () { openReel(REEL_VIDEO_ID); });
    reelClose.addEventListener('click', closeReel);
    reelBackdrop.addEventListener('click', closeReel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !reelModal.hidden) { closeReel(); }
    });
  }

  /* ---------- formulario de contacto (FormSubmit, vía AJAX) ---------- */

  var FORM_EMAIL = 'blackmielrd@gmail.com';
  var form = document.getElementById('contactForm');
  var ok = document.getElementById('contactOk');
  var formError = document.getElementById('contactError');
  var submitBtn = form.querySelector('.contact__submit');
  var submitBtnLabel = submitBtn.textContent;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var payload = {};
    new FormData(form).forEach(function (value, key) { payload[key] = value; });
    payload._captcha = false; // el captcha de FormSubmit es una página propia; no aplica en AJAX
    payload._replyto = payload.correo;

    ok.hidden = true;
    formError.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) { throw new Error('FormSubmit respondió ' + res.status); }
        form.reset();
        ok.hidden = false;
        gsap.fromTo(ok, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 });
      })
      .catch(function () {
        formError.hidden = false;
        gsap.fromTo(formError, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 });
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtnLabel;
      });
  });

  /* ============================================================
     Carruseles de Portafolio: flechas, loop infinito y auto-avance
     con ritmo propio por fila (para que se sienta vivo, no sincronizado).
     ============================================================ */

  var carousels = []; // estado de cada fila inicializada
  var carouselsReady = false;

  function initPortfolioCarousels() {
    if (carouselsReady) { return; }
    carouselsReady = true;

    var rows = document.querySelectorAll('#section-portafolio .row');
    rows.forEach(function (rowEl, idx) {
      var scroller = rowEl.querySelector('.row__scroller');
      if (!scroller) { return; }
      var originals = Array.prototype.slice.call(scroller.children);
      if (originals.length < 3) { return; } // muy pocas cards para un loop útil

      // envolver el scroller en un track para posicionar las flechas
      var track = document.createElement('div');
      track.className = 'row__track';
      scroller.parentNode.insertBefore(track, scroller);
      track.appendChild(scroller);

      var prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'row__arrow row__arrow--prev';
      prevBtn.setAttribute('aria-label', 'Anterior');
      prevBtn.innerHTML = '&#8249;';

      var nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'row__arrow row__arrow--next';
      nextBtn.setAttribute('aria-label', 'Siguiente');
      nextBtn.innerHTML = '&#8250;';

      track.insertBefore(prevBtn, scroller);
      track.appendChild(nextBtn);

      // clonar el set completo antes y después, para loop infinito
      var n = originals.length;
      var fragA = document.createDocumentFragment();
      var fragB = document.createDocumentFragment();
      originals.forEach(function (c) {
        var clA = c.cloneNode(true);
        clA.setAttribute('aria-hidden', 'true');
        clA.setAttribute('tabindex', '-1');
        fragA.appendChild(clA);

        var clB = c.cloneNode(true);
        clB.setAttribute('aria-hidden', 'true');
        clB.setAttribute('tabindex', '-1');
        fragB.appendChild(clB);
      });
      scroller.insertBefore(fragA, originals[0]);
      scroller.appendChild(fragB);

      var all = Array.prototype.slice.call(scroller.children);
      var firstOriginal = all[n];
      var secondOriginal = all[n + 1];
      var firstCloneB = all[2 * n];

      function contentPos(el) {
        return el.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
      }

      // posiciona la vista exactamente al inicio del set "real" (sin animación)
      scroller.scrollLeft = contentPos(firstOriginal);

      var state = {
        scroller: scroller,
        timer: null,
        paused: false,
        settleTimer: null,
        next: function () { scroller.scrollBy({ left: measure().step, behavior: 'smooth' }); },
        prev: function () { scroller.scrollBy({ left: -measure().step, behavior: 'smooth' }); }
      };

      function measure() {
        return {
          step: secondOriginal.getBoundingClientRect().left - firstOriginal.getBoundingClientRect().left,
          firstOriginalPos: contentPos(firstOriginal),
          upperBound: contentPos(firstCloneB)
        };
      }

      // corrige la posición sin animación al cruzar los límites del set clonado
      scroller.addEventListener('scroll', function () {
        clearTimeout(state.settleTimer);
        state.settleTimer = setTimeout(function () {
          var m = measure();
          var w = m.upperBound - m.firstOriginalPos;
          if (scroller.scrollLeft >= m.upperBound - 3) {
            scroller.scrollLeft -= w;
          } else if (scroller.scrollLeft <= m.firstOriginalPos - w + 3) {
            scroller.scrollLeft += w;
          }
        }, 160);
      });

      function restartTimer() {
        clearTimeout(state.timer);
        if (state.paused) { return; }
        // 2.7–3.3s con jitter aleatorio: cada fila deriva a su propio ritmo
        var delay = 2700 + Math.random() * 600;
        state.timer = setTimeout(function () {
          state.next();
          restartTimer();
        }, delay);
      }

      state.restart = restartTimer;

      prevBtn.addEventListener('click', function () { state.prev(); restartTimer(); });
      nextBtn.addEventListener('click', function () { state.next(); restartTimer(); });

      track.addEventListener('pointerenter', function () { clearTimeout(state.timer); });
      track.addEventListener('pointerleave', function () { restartTimer(); });

      // arranque escalonado por fila para que no se muevan sincronizadas
      setTimeout(restartTimer, idx * 500);

      carousels.push(state);
    });
  }

  function pauseCarousels() {
    carousels.forEach(function (c) {
      c.paused = true;
      clearTimeout(c.timer);
    });
  }

  function resumeCarousels() {
    carousels.forEach(function (c) {
      if (!c.paused) { return; }
      c.paused = false;
      c.restart();
    });
  }

  /* ============================================================
     Panel de Cortometrajes: detalle inline debajo de la fila.
     No es modal — la página sigue siendo usable, no bloquea scroll,
     y solo se cierra con el botón ✕ (nunca al hacer clic afuera).
     Va debajo de la fila y no dentro de la card porque el carrusel
     clona cada card 3 veces para el loop infinito (ver arriba); un
     panel dentro de la card se triplicaría y quedaría recortado por
     el overflow-x del scroller.
     ============================================================ */

  var SHORTS = {
    'el-amuleto': {
      titulo: 'El Amuleto', anio: 2025, duracion: '7 min', genero: 'Drama, experimental',
      poster: 'assets/posters/el-amuleto.jpg',
      sinopsis: 'Una moneda. Un deseo. Un joven convencido de que tiene el control. La suerte, sin embargo, tiene sus propias reglas. Y no siempre juega limpio.',
      direccion: 'Danny Camacho', publico: false, linkPublico: null
    },
    'cuando-pienso': {
      titulo: 'Cuando Pienso en mi Muerte', anio: 2024, duracion: '13 min', genero: 'Drama',
      poster: 'assets/posters/cuando-pienso-en-mi-muerte.jpg',
      sinopsis: 'Hay dolores que no se olvidan, sino que se acumulan. Gabriel lo sabe. Atrapado entre la culpa y los fantasmas de su infancia, deberá recorrer sus propios recuerdos fragmentados para descubrir si la reconciliación es posible o solo otra forma de pérdida.',
      direccion: 'Danny Camacho', publico: false, linkPublico: null
    },
    'un-mundo-casi-feliz': {
      titulo: 'Un Mundo Casi Feliz', anio: 2020, duracion: '3 min', genero: 'Comedia, drama',
      poster: 'assets/posters/un-mundo-casi-feliz.jpg',
      sinopsis: 'Jefri y Ariel son roomies que viven inmersos en placeres mundanos, consumismo y una conexión excesiva a la red que los desconecta cada vez más entre ellos.',
      direccion: 'Danny Camacho', publico: false, linkPublico: null
    },
    'lenguaje-inclusivo': {
      titulo: 'Lenguaje Inclusivo', anio: 2021, duracion: '3 min', genero: 'Comedia',
      poster: 'assets/posters/lenguaje-inclusivo.jpg',
      sinopsis: 'Reflejo cómico de la importancia del conocimiento y las posibles consecuencias que puede traer la ignorancia.',
      direccion: 'Danny Camacho', publico: false, linkPublico: null
    },
    'pequenos-gestos': {
      titulo: 'Pequeños Gestos', anio: 2019, duracion: '3 min', genero: 'Drama, comedia, mockumentary',
      poster: 'assets/posters/pequenos-gestos.jpg',
      sinopsis: 'Un inmigrante chino cuenta lo bueno y lo malo de vivir en República Dominicana como inmigrante asiático.',
      direccion: 'Danny Camacho', publico: false, linkPublico: null
    },
    'el-poema-de-lisa': {
      titulo: 'El Poema de Lisa', anio: 2019, duracion: '13 min', genero: 'Drama, experimental',
      poster: 'assets/posters/el-poema-de-lisa.jpg',
      sinopsis: 'Lisa sufre depresión, siente que su vida está vacía, nada tiene sentido para ella. Intenta curar su dolor con drogas, pero eso solo empeorará su vida.',
      direccion: 'Danny Camacho', publico: false, linkPublico: null
    },
    'el-quinto': {
      titulo: 'El Quinto', anio: 2018, duracion: '15 min', genero: 'Drama, aventura',
      poster: 'assets/posters/el-quinto.jpg',
      sinopsis: 'Cinco tipos naufragan en una isla desierta; Ricardo, tratando de sobrevivir, enfrentará un dilema que pondrá a prueba su humanidad.',
      direccion: 'Danny Camacho', publico: false, linkPublico: null
    },
    'la-rueda-rueda': {
      titulo: 'La Rueda Rueda', anio: 2018, duracion: '6 min', genero: 'Drama (estudiantil)',
      poster: 'assets/posters/la-rueda-rueda.jpg',
      sinopsis: 'Pepe le cuenta a su amigo Samuel cómo su primo Kiki contrajo VIH y lo improbable que es que ellos se contagien. La vida de Samuel se volverá caótica porque el mundo es demasiado pequeño.',
      direccion: 'Danny Camacho', publico: false, linkPublico: null
    }
  };

  var shortsPanel = document.getElementById('shortsPanel');
  var shortsPanelOpenId = null;

  function renderShort(data) {
    var accion = (data.publico && data.linkPublico)
      ? '<a class="shorts-panel__ver" href="' + data.linkPublico + '" target="_blank" rel="noopener">▶ Ver</a>'
      : '<span class="shorts-panel__badge">Actualmente en circuito de festivales</span>';

    return '' +
      '<div class="shorts-panel__inner">' +
        '<button class="shorts-panel__close" type="button" aria-label="Cerrar">✕</button>' +
        '<img class="shorts-panel__poster" src="' + data.poster + '" alt="Póster de ' + data.titulo + '">' +
        '<div class="shorts-panel__body">' +
          '<h4 class="shorts-panel__title">' + data.titulo + '</h4>' +
          '<p class="shorts-panel__meta">' + data.anio + ' · ' + data.genero + ' · ' + data.duracion + '</p>' +
          '<p class="shorts-panel__synopsis">' + data.sinopsis + '</p>' +
          '<p class="shorts-panel__credits">Dirección: ' + data.direccion + '</p>' +
          accion +
        '</div>' +
      '</div>';
  }

  function closeShortsPanel() {
    if (!shortsPanelOpenId) { return; }
    shortsPanelOpenId = null;
    resumeCarousels();
    gsap.to(shortsPanel, {
      height: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut',
      onComplete: function () {
        shortsPanel.hidden = true;
        shortsPanel.innerHTML = '';
        shortsPanel.style.height = '';
      }
    });
  }

  function openShortsPanel(id) {
    var data = SHORTS[id];
    if (!data) { return; }

    if (shortsPanelOpenId === id) { closeShortsPanel(); return; } // clic sobre la misma card: cierra

    var wasOpen = !!shortsPanelOpenId;
    shortsPanelOpenId = id;
    shortsPanel.innerHTML = renderShort(data);
    shortsPanel.hidden = false;

    if (wasOpen) {
      gsap.set(shortsPanel, { height: 'auto', opacity: 1 }); // ya estaba abierto: solo cambia el contenido
    } else {
      gsap.fromTo(shortsPanel, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.45, ease: 'power2.out' });
    }

    pauseCarousels(); // no se debe mover el carrusel mientras se lee el detalle

    setTimeout(function () {
      shortsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, wasOpen ? 0 : 200);
  }

  if (shortsPanel) {
    document.addEventListener('click', function (e) {
      var shortCard = e.target.closest('.card[data-short]');
      if (shortCard) { openShortsPanel(shortCard.dataset.short); return; }

      var closeBtn = e.target.closest('.shorts-panel__close');
      if (closeBtn) { closeShortsPanel(); }
    });
  }

  /* ---------- arranque: un enlace compartido entra directo a la sección,
     sin splash ni selector de perfiles ---------- */

  var deepLinkSection = PATH_TO_SECTION[location.pathname];
  if (deepLinkSection) {
    splash.classList.remove('screen--visible');
    splash.style.display = 'none';
    profiles.classList.remove('screen--visible');
    profiles.style.display = 'none';

    showSection(deepLinkSection, { skipPush: true });
    app.classList.add('screen--visible');
    gsap.fromTo(app, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power1.out' });
  }
})();
