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

  function showSection(name) {
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
  navLogo.addEventListener('click', function () {
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

  /* ---------- formulario de contacto (placeholder) ---------- */

  var form = document.getElementById('contactForm');
  var ok = document.getElementById('contactOk');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    // pendiente: conectar con backend / servicio de correo real
    form.reset();
    ok.hidden = false;
    gsap.fromTo(ok, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 });
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
})();
