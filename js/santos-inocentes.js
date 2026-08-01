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

  /* ---------- formulario de contacto (placeholder) ---------- */

  var dsiForm = document.getElementById('dsiForm');
  var dsiFormOk = document.getElementById('dsiFormOk');

  if (dsiForm) {
    dsiForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!dsiForm.checkValidity()) {
        dsiForm.reportValidity();
        return;
      }
      // pendiente: conectar con backend / servicio de correo real
      dsiForm.reset();
      dsiFormOk.hidden = false;
    });
  }
})();
