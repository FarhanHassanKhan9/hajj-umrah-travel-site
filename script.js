(function () {
  'use strict';

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Accordion (FAQ)
  var triggers = document.querySelectorAll('.accordion-trigger');
  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      var isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Close all other panels (single-open accordion)
      triggers.forEach(function (t) {
        if (t !== trigger) {
          t.setAttribute('aria-expanded', 'false');
          var p = document.getElementById(t.getAttribute('aria-controls'));
          if (p) p.style.maxHeight = null;
        }
      });

      trigger.setAttribute('aria-expanded', String(!isOpen));
      if (!isOpen) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      } else {
        panel.style.maxHeight = null;
      }
    });
  });

  // Quick package finder -> filters the package grid for real, carries context to the contact form
  var finder = document.getElementById('quickFinder');
  var departureInput = document.getElementById('f-departure');
  if (departureInput) {
    // Don't let visitors pick a departure date that's already in the past
    departureInput.min = new Date().toISOString().slice(0, 10);
  }

  var packageCards = Array.prototype.slice.call(document.querySelectorAll('.package-card'));
  var noMatchNote = document.getElementById('packageNoMatch');
  var finderMatchTimer = null;

  function applyFinderFilters(filters) {
    var anyFilterSet = Boolean(filters.type || filters.duration || filters.budget);
    var matched = [];

    packageCards.forEach(function (card) {
      var typeOk = !filters.type || card.dataset.type === filters.type;
      var durationOk = !filters.duration || card.dataset.duration === filters.duration || card.dataset.duration === 'custom';
      var budgetOk = !filters.budget || card.dataset.budget === filters.budget || card.dataset.budget === 'custom';
      var isMatch = typeOk && durationOk && budgetOk;

      card.classList.toggle('is-filtered-out', anyFilterSet && !isMatch);
      if (isMatch) matched.push(card);
    });

    var showAllFallback = anyFilterSet && matched.length === 0;
    if (showAllFallback) {
      packageCards.forEach(function (card) { card.classList.remove('is-filtered-out'); });
    }
    if (noMatchNote) noMatchNote.hidden = !showAllFallback;

    // Briefly highlight the matching cards so the filter feels like it did something
    var toHighlight = showAllFallback ? [] : matched;
    packageCards.forEach(function (card) {
      card.classList.toggle('is-finder-match', anyFilterSet && toHighlight.indexOf(card) !== -1);
    });
    if (finderMatchTimer) clearTimeout(finderMatchTimer);
    if (anyFilterSet) {
      finderMatchTimer = window.setTimeout(function () {
        packageCards.forEach(function (card) { card.classList.remove('is-finder-match'); });
      }, 2200);
    }
  }

  if (finder) {
    finder.addEventListener('submit', function (e) {
      e.preventDefault();

      var chosenDeparture = departureInput ? departureInput.value : '';
      var chosenDuration = document.getElementById('f-duration').value;
      var chosenPackage = document.getElementById('f-package').value;
      var chosenBudget = document.getElementById('f-budget').value;

      applyFinderFilters({ type: chosenPackage, duration: chosenDuration, budget: chosenBudget });

      var mainPackageSelect = document.getElementById('package');
      if (chosenPackage && mainPackageSelect) {
        for (var i = 0; i < mainPackageSelect.options.length; i++) {
          if (mainPackageSelect.options[i].value === chosenPackage) {
            mainPackageSelect.selectedIndex = i;
            break;
          }
        }
      }

      var messageField = document.getElementById('message');
      if (chosenDeparture && messageField && !messageField.value) {
        messageField.value = 'Preferred travel date: ' + chosenDeparture;
      }

      var packagesSection = document.getElementById('packages');
      if (packagesSection) packagesSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Contact form -> WhatsApp handoff
  var WHATSAPP_NUMBER = '923248496676';
  var form = document.getElementById('inquiryForm');
  var formNote = document.getElementById('formNote');

  function setError(fieldId, message) {
    var errorEl = document.getElementById(fieldId + '-error');
    var inputEl = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = message || '';
    if (inputEl) {
      if (message) inputEl.setAttribute('aria-invalid', 'true');
      else inputEl.removeAttribute('aria-invalid');
    }
  }

  // Returns the id of the first invalid field, or null if the form is valid
  function validateForm(data) {
    var firstErrorId = null;
    setError('name', '');
    setError('phone', '');

    if (!data.name.trim()) {
      setError('name', 'Please enter your name.');
      firstErrorId = firstErrorId || 'name';
    }

    var phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('phone', 'Please enter a valid phone number.');
      firstErrorId = firstErrorId || 'phone';
    }

    return firstErrorId;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        package: document.getElementById('package').value,
        travelers: document.getElementById('travelers').value,
        message: document.getElementById('message').value
      };

      var firstErrorId = validateForm(data);
      if (firstErrorId) {
        formNote.textContent = 'Please fix the highlighted fields.';
        formNote.style.color = '#c0392b';
        var invalidEl = document.getElementById(firstErrorId);
        if (invalidEl) invalidEl.focus();
        return;
      }

      var lines = [
        'Assalam-o-Alaikum, I would like to request a quote.',
        'Name: ' + data.name,
        'Phone: ' + data.phone,
        'Package: ' + data.package,
        'Travelers: ' + data.travelers
      ];
      if (data.message.trim()) {
        lines.push('Message: ' + data.message.trim());
      }

      var text = encodeURIComponent(lines.join('\n'));
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text;
      var whatsappWindow = window.open(url, '_blank', 'noopener');

      if (!whatsappWindow) {
        // Popup blocked, or no WhatsApp handler available on this device
        formNote.style.color = '#c0392b';
        formNote.innerHTML = 'Your browser blocked the WhatsApp popup — <a href="' + url + '" target="_blank" rel="noopener">tap here to continue</a>.';
        return;
      }

      formNote.style.color = 'var(--green-700)';
      formNote.textContent = 'Opening WhatsApp with your inquiry…';
      form.reset();
    });

    // Clear individual field errors as user types
    ['name', 'phone'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { setError(id, ''); });
    });
  }
})();
