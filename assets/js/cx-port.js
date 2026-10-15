/* ============================================================
   COMPLEXANT PARTNERS — sub-page script (cx-port)
   One file for every page except index.html. Each feature is a
   self-contained block that does nothing when its hooks are absent.
   ============================================================ */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.body.getAttribute('data-cx-page') || '';

  /* ------------------------------------------------------------
     Site map — the one place navigation is defined. Adding a page
     (for example a future Tools entry on the .ai domain) is a
     single line here; header, overlay and footer all read from it.
     ------------------------------------------------------------ */
  var SERVICES = [
    { id: 'regulatory-risk', href: 'regulatory-risk.html', num: '01', name: 'Regulatory Risk', line: 'Find where the exposure actually is', icon: 'assets/icons/pillar-01-regulatory-risk.svg', status: 'live' },
    { id: 'sandbox', href: 'sandbox.html', num: '02', name: 'Sandbox', line: 'Prove it before it touches production', icon: 'assets/icons/pillar-02-sandbox.svg', status: 'soon' },
    { id: 'implementation', href: 'implementation.html', num: '03', name: 'Implementation', line: 'Put it in place and make it hold up', icon: 'assets/icons/pillar-03-implementation.svg', status: 'live' },
    { id: 'monitoring', href: 'monitoring.html', num: '04', name: 'Monitoring', line: 'Keep it qualified as it changes', icon: 'assets/icons/pillar-04-monitoring.svg', status: 'live' }
  ];
  var NAV = [
    { id: 'approach', href: 'approach.html', label: 'Our Approach' },
    { id: 'services', label: 'Services', children: SERVICES },
    { id: 'who-we-serve', href: 'who-we-serve.html', label: 'Who We Serve' },
    { id: 'about', href: 'about.html', label: 'About' },
    { id: 'insights', href: 'insights.html', label: 'Insights' }
  ];
  var isService = SERVICES.some(function (s) { return s.id === page; });

  function cur(id) { return id === page ? ' aria-current="page"' : ''; }
  var BRAND =
    '<img src="assets/signal.png" alt="" width="36" height="36" />' +
    '<span class="cx-brand-type">' +
      '<span class="cx-brand-name">COMPLE<span class="cx-x">X</span>ANT</span>' +
      '<span class="cx-brand-sub">PARTNERS</span><span class="cx-brand-llc">LLC</span>' +
    '</span>';
  var CARET = '<svg class="cx-caret" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function chip(status) {
    return status === 'soon'
      ? '<span class="cx-chip cx-chip--soon">Tool soon</span>'
      : '';
  }

  /* ---------- header ---------- */
  var headerSlot = document.querySelector('[data-cx-header]');
  if (headerSlot) {
    var links = NAV.map(function (item) {
      if (item.children) {
        var on = isService ? ' on' : '';
        return '<div class="cx-has-flyout">' +
          '<button class="cx-navlink' + on + '" type="button" aria-expanded="false" aria-controls="cx-flyout">' + item.label + CARET + '</button>' +
          '<div class="cx-flyout" id="cx-flyout">' +
          item.children.map(function (s) {
            return '<a href="' + s.href + '"' + cur(s.id) + '><img src="' + s.icon + '" alt="" />' +
              '<span><strong>' + s.name + '</strong><span>' + s.line + '</span></span>' + chip(s.status) + '</a>';
          }).join('') +
          '</div></div>';
      }
      var on2 = item.id === page ? ' on' : '';
      return '<a class="cx-navlink' + on2 + '" href="' + item.href + '"' + cur(item.id) + '>' + item.label + '</a>';
    }).join('');

    headerSlot.outerHTML =
      '<header class="cx-header">' +
        '<div class="cx-wrap cx-header-inner">' +
          '<a class="cx-brand" href="index.html" aria-label="Complexant Partners LLC, home">' + BRAND + '</a>' +
          '<nav class="cx-nav" aria-label="Primary">' + links + '</nav>' +
          '<div class="cx-header-actions">' +
            '<a class="cx-ghost" href="contact.html"' + cur('contact') + '>Let&rsquo;s Talk</a>' +
            '<button class="cx-menu-btn" type="button" aria-expanded="false" aria-controls="cx-overlay" aria-label="Open menu">' +
              '<span class="cx-menu-glyph" aria-hidden="true"><i></i><i></i><i></i></span><span class="cx-menu-label">Menu</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<div class="cx-overlay" id="cx-overlay" aria-label="Site menu">' +
        '<nav aria-label="Mobile">' +
          '<a href="index.html">Home</a>' +
          NAV.map(function (item) {
            if (item.children) {
              return '<p class="cx-eyebrow cx-overlay-label">' + item.label + '</p><div class="cx-overlay-sub">' +
                item.children.map(function (s) {
                  return '<a class="cx-named" href="' + s.href + '"' + cur(s.id) + '><img class="cx-named-icon" src="' + s.icon + '" alt="" />' + s.name + chip(s.status) + '</a>';
                }).join('') +
                '</div>';
            }
            return '<a href="' + item.href + '"' + cur(item.id) + '>' + item.label + '</a>';
          }).join('') +
          '<a href="contact.html"' + cur('contact') + '>Contact</a>' +
        '</nav>' +
      '</div>';
  }

  /* ---------- footer ---------- */
  var footerSlot = document.querySelector('[data-cx-footer]');
  if (footerSlot) {
    var year = new Date().getFullYear();
    footerSlot.outerHTML =
      '<footer class="cx-footer">' +
        '<div class="cx-wrap">' +
          '<div class="cx-footer-grid">' +
            '<div>' +
              '<a class="cx-brand" href="index.html" aria-label="Complexant Partners LLC, home">' + BRAND + '</a>' +
              '<a class="cx-footer-mail" href="mailto:info@complexantpartners.com">info@complexantpartners.com</a>' +
              '<p class="cx-eyebrow" style="margin-top:18px">Complexity &middot; Competency &middot; Clarity</p>' +
              '<p class="cx-small cx-muted" style="margin-top:18px">Complexant Partners LLC<br />8 The Green, Suite 24683<br />Dover, DE 19901</p>' +
            '</div>' +
            '<nav aria-label="Company"><h2>Company</h2><ul class="cx-footer-links">' +
              '<li><a href="index.html">Home</a></li>' +
              NAV.filter(function (n) { return !n.children; }).map(function (n) { return '<li><a href="' + n.href + '">' + n.label + '</a></li>'; }).join('') +
              '<li><a href="contact.html">Contact</a></li>' +
            '</ul></nav>' +
            '<nav aria-label="Services"><h2>Services</h2><ul class="cx-footer-links">' +
              SERVICES.map(function (s) { return '<li><a href="' + s.href + '">' + s.name + '</a></li>'; }).join('') +
            '</ul></nav>' +
          '</div>' +
          '<div class="cx-footer-bottom"><span>&copy; ' + year + ' Complexant Partners LLC</span><span>Safely adapting to innovation</span></div>' +
        '</div>' +
      '</footer>';
  }

  /* ---------- header scrim, menu overlay, flyout ---------- */
  var header = document.querySelector('.cx-header');
  if (header) {
    var stuck = function () { header.classList.toggle('is-stuck', window.scrollY > 24); };
    stuck();
    window.addEventListener('scroll', stuck, { passive: true });
  }

  var menuBtn = document.querySelector('.cx-menu-btn');
  var overlay = document.getElementById('cx-overlay');
  if (menuBtn && overlay) {
    var label = menuBtn.querySelector('.cx-menu-label');
    var setMenu = function (open) {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (label) label.textContent = open ? 'Close' : 'Menu';
      overlay.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { var first = overlay.querySelector('a'); if (first) first.focus(); }
    };
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 980) setMenu(false); });
  }

  // The flyout opens on hover and :focus-within in CSS. The button adds a
  // click toggle for touch, and Escape closes it.
  var flyWrap = document.querySelector('.cx-has-flyout');
  if (flyWrap) {
    var flyBtn = flyWrap.querySelector('button');
    var setFly = function (open) { flyWrap.classList.toggle('is-open', open); flyBtn.setAttribute('aria-expanded', String(open)); };
    flyBtn.addEventListener('click', function () { setFly(!flyWrap.classList.contains('is-open')); });
    flyWrap.addEventListener('mouseenter', function () { flyBtn.setAttribute('aria-expanded', 'true'); });
    flyWrap.addEventListener('mouseleave', function () { setFly(false); });
    flyWrap.addEventListener('focusin', function () { flyWrap.classList.remove('is-dismissed'); });
    flyWrap.addEventListener('focusout', function (e) { if (!flyWrap.contains(e.relatedTarget)) setFly(false); });
    // Escape hides it while focus stays on the trigger; :focus-within would
    // otherwise keep it open
    flyWrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setFly(false); flyWrap.classList.add('is-dismissed'); flyBtn.focus(); }
    });
  }

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
