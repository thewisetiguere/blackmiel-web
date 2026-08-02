(function () {
  'use strict';

  var reveals = document.querySelectorAll('.dsi__reveal');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('dsi__reveal--in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  reveals.forEach(function (el) { observer.observe(el); });

  /* ---------- panel desplegable de niveles de patrocinio ---------- */

  var btnToggle = document.getElementById('btnTogglePatrocinio');
  var panel = document.getElementById('patrocinioPanel');

  if (btnToggle && panel) {
    btnToggle.addEventListener('click', function () {
      var isOpen = panel.classList.toggle('dsi__panel--open');
      btnToggle.setAttribute('aria-expanded', String(isOpen));
      btnToggle.firstChild.textContent = isOpen ? 'Ocultar niveles de patrocinio ' : 'Ver niveles de patrocinio ';
      if (isOpen) {
        setTimeout(function () {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    });
  }

  /* ---------- formulario de contacto (FormSubmit, vía AJAX) ---------- */

  var FORM_EMAIL = 'blackmielrd@gmail.com';
  var dsiForm = document.getElementById('dsiForm');
  var dsiFormOk = document.getElementById('dsiFormOk');
  var dsiFormError = document.getElementById('dsiFormError');

  if (dsiForm) {
    var dsiSubmitBtn = dsiForm.querySelector('button[type="submit"]');
    var dsiSubmitLabel = dsiSubmitBtn.textContent;

    dsiForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!dsiForm.checkValidity()) {
        dsiForm.reportValidity();
        return;
      }

      var payload = {};
      new FormData(dsiForm).forEach(function (value, key) { payload[key] = value; });
      payload._captcha = false; // el captcha de FormSubmit es una página propia; no aplica en AJAX
      payload._replyto = payload.correo;

      dsiFormOk.hidden = true;
      dsiFormError.hidden = true;
      dsiSubmitBtn.disabled = true;
      dsiSubmitBtn.textContent = 'Enviando…';

      fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) { throw new Error('FormSubmit respondió ' + res.status); }
          dsiForm.reset();
          dsiFormOk.hidden = false;
        })
        .catch(function () {
          dsiFormError.hidden = false;
        })
        .then(function () {
          dsiSubmitBtn.disabled = false;
          dsiSubmitBtn.textContent = dsiSubmitLabel;
        });
    });
  }
})();
