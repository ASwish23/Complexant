/* ============================================================
   COMPLEXANT PARTNERS — sub-page script (cx-port)
   One file for every page except index.html. Each feature is a
   self-contained block that does nothing when its hooks are absent.
   The header, menus, search and footer are static markup written by
   tools/build-shell.py, driven by assets/js/cx-shell.js.
   ============================================================ */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- cursor spotlight on cards ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    var pending = null;
    document.addEventListener('mousemove', function (e) {
      if (pending) return;
      var x = e.clientX, y = e.clientY, target = e.target;
      pending = requestAnimationFrame(function () {
        pending = null;
        var card = target && target.closest ? target.closest('.cx-card') : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (x - r.left) + 'px');
        card.style.setProperty('--my', (y - r.top) + 'px');
      });
    }, { passive: true });
  }

  /* ---------- scroll reveal ---------- */
  var rv = document.querySelectorAll('.cx-rv');
  if (!('IntersectionObserver' in window) || reduced) {
    rv.forEach(function (el) { el.setAttribute('data-in', ''); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.setAttribute('data-in', ''); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* ---------- count-up metrics ---------- */
  var counters = document.querySelectorAll('[data-cx-count]');
  if (counters.length) {
    var run = function (el) {
      var to = parseInt(el.getAttribute('data-cx-count'), 10) || 0;
      if (reduced) { el.textContent = to; return; }
      var t0 = performance.now(), dur = 1200;
      var step = function (now) {
        var p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) counters.forEach(run);
    else {
      // the markup holds the final value for no-JS; start from zero once observed
      if (!reduced) counters.forEach(function (c) { c.textContent = '0'; });
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cio.observe(c); });
    }
  }

  /* ---------- FAQ accordion: one open at a time ---------- */
  document.querySelectorAll('.cx-faq').forEach(function (faq) {
    var items = faq.querySelectorAll('.cx-faq-item');
    items.forEach(function (item) {
      var q = item.querySelector('.cx-faq-q');
      q.addEventListener('click', function () {
        var open = !item.classList.contains('open');
        items.forEach(function (o) {
          o.classList.remove('open');
          o.querySelector('.cx-faq-q').setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('open', open);
        q.setAttribute('aria-expanded', String(open));
      });
    });
  });

  /* ---------- ARIA tabs with arrow-key navigation ---------- */
  document.querySelectorAll('.cx-tabs').forEach(function (wrap) {
    var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') n = tabs[0];
        else if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- filter chips ---------- */
  document.querySelectorAll('[data-cx-filter-scope]').forEach(function (scope) {
    var chips = scope.querySelectorAll('[data-cx-filter]');
    var cards = scope.querySelectorAll('[data-category]');
    var count = scope.querySelector('.cx-count');
    var apply = function (cat) {
      var shown = 0;
      cards.forEach(function (c) {
        var match = cat === 'all' || c.getAttribute('data-category') === cat;
        c.hidden = !match;
        if (match) shown++;
      });
      chips.forEach(function (ch) { ch.setAttribute('aria-pressed', String(ch.getAttribute('data-cx-filter') === cat)); });
      if (count) count.textContent = shown + (shown === 1 ? ' article' : ' articles');
    };
    chips.forEach(function (ch) { ch.addEventListener('click', function () { apply(ch.getAttribute('data-cx-filter')); }); });
    apply('all');
  });

  /* ---------- journey timeline scroll-spy ---------- */
  document.querySelectorAll('.cx-journey').forEach(function (j) {
    var steps = Array.prototype.slice.call(j.querySelectorAll('.cx-step'));
    var bar = j.querySelector('.cx-journey-progress');
    var STOPS = [12, 38, 64, 100];
    var last = -1;
    var mark = function (idx) {
      if (idx === last) return;
      last = idx;
      steps.forEach(function (s, i) {
        s.classList.toggle('active', i === idx);
        s.classList.toggle('done', i < idx);
      });
      if (bar) {
        var pct = STOPS[Math.round(idx / Math.max(steps.length - 1, 1) * (STOPS.length - 1))];
        bar.style.height = 'calc((100% - 16px) * ' + pct / 100 + ')';
      }
    };
    if (reduced) { mark(steps.length - 1); steps.forEach(function (s) { s.classList.add('done'); }); return; }
    j.classList.add('is-live');
    var update = function () {
      var target = window.innerHeight * 0.45, best = 0, bestD = Infinity;
      steps.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - target);
        if (d < bestD) { bestD = d; best = i; }
      });
      mark(best);
    };
    var queued = false;
    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; update(); }); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- maturity slider ---------- */
  // Five bars move from scattered heights to an ordered taper that ends in
  // the copper point: the signal's scatter-to-clarity, stage by stage.
  var BARS = [
    { h: [0.42, 0.86, 0.28, 0.66, 0.5], y: [-18, 5, 26, -14, 20] },
    { h: [0.6, 0.78, 0.36, 0.6, 0.42], y: [-10, 8, 14, -8, 12] },
    { h: [0.8, 0.7, 0.5, 0.46, 0.3], y: [-4, 4, 6, -3, 4] },
    { h: [0.9, 0.72, 0.52, 0.34, 0.18], y: [0, 0, 0, 0, 0] },
    { h: [0.94, 0.74, 0.54, 0.34, 0.12], y: [0, 0, 0, 0, 0] }
  ];
  document.querySelectorAll('[data-cx-stages]').forEach(function (input) {
    var stages;
    try { stages = JSON.parse(input.getAttribute('data-cx-stages')); } catch (err) { return; }
    var root = input.closest('.cx-maturity') || document;
    var nameEl = root.querySelector('.cx-stage-name');
    var descEl = root.querySelector('.cx-stage-desc');
    var numEl = root.querySelector('.cx-stage-num');
    var bars = root.querySelectorAll('.cx-mbar');
    var set = function () {
      var v = parseInt(input.value, 10) || 0;
      var s = stages[v] || stages[0];
      if (nameEl) nameEl.textContent = s.name;
      if (descEl) descEl.textContent = s.desc;
      if (numEl) numEl.textContent = 'Stage ' + (v + 1) + ' of ' + stages.length;
      input.setAttribute('aria-valuetext', 'Stage ' + (v + 1) + ': ' + s.name);
      input.style.setProperty('--cx-fill', (v / (stages.length - 1) * 100) + '%');
      var shape = BARS[Math.min(v, BARS.length - 1)];
      bars.forEach(function (b, i) {
        b.style.setProperty('--h', shape.h[i]);
        b.style.setProperty('--y', shape.y[i] + '%');
        b.classList.toggle('is-apex', v >= 3 && i === bars.length - 1);
      });
    };
    input.addEventListener('input', set);
    set();
  });

  /* ---------- bios: expand, and dim the sibling card ---------- */
  document.querySelectorAll('[data-cx-bio-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('.cx-bio-label').textContent = open ? 'Hide full bio' : 'Read full bio';
      if (panel) panel.hidden = !open;
    });
  });
  document.querySelectorAll('.cx-people').forEach(function (group) {
    var people = group.querySelectorAll('.cx-person');
    var on = function (p) { group.classList.add('has-focus'); people.forEach(function (x) { x.classList.toggle('is-focused', x === p); }); };
    var off = function () { group.classList.remove('has-focus'); people.forEach(function (x) { x.classList.remove('is-focused'); }); };
    people.forEach(function (p) {
      p.addEventListener('mouseenter', function () { on(p); });
      p.addEventListener('mouseleave', off);
      p.addEventListener('focusin', function () { on(p); });
      p.addEventListener('focusout', function (e) { if (!p.contains(e.relatedTarget)) off(); });
    });
  });

  /* ---------- contact form ---------- */
  // Same delivery as the home page form: validated here, then handed to the
  // visitor's mail client addressed to info@. Swap for a form backend later by
  // setting the form's action and removing the mailto step.
  var form = document.querySelector('[data-cx-form]');
  if (form) {
    var msg = form.querySelector('.cx-form-msg');
    var thanks = document.querySelector('.cx-thanks');
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ?topic=sandbox preselects "where to start"
    var topic = new URLSearchParams(window.location.search).get('topic');
    var startSel = form.querySelector('[name="start"]');
    if (topic && startSel && startSel.querySelector('option[value="' + topic + '"]')) startSel.value = topic;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, email = form.elements.email;
      var errors = [];
      name.setAttribute('aria-invalid', String(!name.value.trim()));
      email.setAttribute('aria-invalid', String(!EMAIL.test(email.value.trim())));
      if (!name.value.trim()) errors.push('add your name');
      if (!EMAIL.test(email.value.trim())) errors.push('enter an email address like you@company.com');
      if (errors.length) {
        msg.textContent = 'To send this, ' + errors.join(' and ') + '.';
        (name.getAttribute('aria-invalid') === 'true' ? name : email).focus();
        return;
      }
      msg.textContent = '';
      var val = function (n) { var f = form.elements[n]; if (!f) return ''; return f.tagName === 'SELECT' ? (f.value ? f.options[f.selectedIndex].text : '') : f.value.trim(); };
      var body = ['Name: ' + val('name'), 'Email: ' + val('email'), 'Company: ' + val('company'), 'Role: ' + val('role'),
        'Sector: ' + val('sector'), 'Stage: ' + val('stage'), 'Where to start: ' + val('start'), '', val('message')].join('\n');
      window.location.href = 'mailto:info@complexantpartners.com?subject=' +
        encodeURIComponent('Website inquiry from ' + val('name')) + '&body=' + encodeURIComponent(body);
      form.hidden = true;
      if (thanks) { thanks.hidden = false; var h = thanks.querySelector('h2, h3'); if (h) { h.tabIndex = -1; h.focus(); } }
    });
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false');
    });
    document.querySelectorAll('[data-cx-reset]').forEach(function (b) {
      b.addEventListener('click', function () {
        form.reset();
        form.hidden = false;
        if (thanks) thanks.hidden = true;
        form.elements.name.focus();
      });
    });
  }
})();
