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

  /* ---------- pillar rail ----------
     The home page's "What we do" cards: one open at a time from 1000px.
     Regulatory Risk rests open; hovering, focusing or clicking another
     opens it; leaving the rail returns to Regulatory Risk. Arrow keys move
     between pillars. The open card is openW wide, the rest closedW, each
     placed with transform and sized with width on the same curve. */
  document.querySelectorAll('.pillar-rail').forEach(function (rail) {
    var pillars = Array.prototype.slice.call(rail.querySelectorAll('.pillar'));
    var heads = pillars.map(function (p) { return p.querySelector('.pillar-head'); });
    var REST = 0;                                  // Regulatory Risk
    var wide = window.matchMedia('(min-width:1000px)');
    // narrowest open card that still fits its copy and button; short of it, stack
    var MIN_OPEN = 340;
    var open = REST, closedW = 0, openW = 0, gap = 0, live = false;

    var place = function () {
      var step = closedW + gap;   // a closed card plus the gap after it
      pillars.forEach(function (p, i) {
        var on = i === open;
        p.classList.toggle('is-open', on);
        heads[i].setAttribute('aria-expanded', String(on));
        if (!live) return;
        var x = i <= open ? i * step : openW + gap + (i - 1) * step;
        p.style.setProperty('--x', x + 'px');
        p.style.setProperty('--w', (on ? openW : closedW) + 'px');
      });
    };

    var layout = function () {
      // a layout pass (load, resize, fonts) snaps into place; only switching animates
      rail.classList.add('no-anim');
      requestAnimationFrame(function () { requestAnimationFrame(function () { rail.classList.remove('no-anim'); }); });
      var n = pillars.length;
      var w = rail.clientWidth;
      gap = parseFloat(getComputedStyle(rail).getPropertyValue('--card-gap')) || 0;
      // wide enough for the longest one-word name ("Implementation") at its larger size
      closedW = Math.round(Math.min(270, Math.max(220, w * 0.19)));
      openW = w - (closedW + gap) * (n - 1);
      live = wide.matches && openW >= MIN_OPEN;
      rail.classList.toggle('is-live', live);
      if (!live) {
        // stacked: every card open, nothing to switch
        pillars.forEach(function (p, i) {
          p.classList.add('is-open');
          p.style.removeProperty('--x');
          p.style.removeProperty('--w');
          heads[i].setAttribute('aria-expanded', 'true');
          heads[i].tabIndex = -1;
        });
        return;
      }
      rail.style.setProperty('--closed-w', closedW + 'px');
      rail.style.setProperty('--open-w', openW + 'px');
      heads.forEach(function (h) { h.tabIndex = 0; });
      // the rail is as tall as the tallest pillar when open
      var h = 0;
      pillars.forEach(function (p) {
        p.style.height = 'auto';
        h = Math.max(h, p.offsetHeight);
        p.style.height = '';
      });
      rail.style.setProperty('--rail-h', Math.ceil(h) + 'px');
      place();
    };

    var show = function (i) {
      if (!live || i === open) return;
      open = i;
      place();
    };

    pillars.forEach(function (p, i) {
      p.addEventListener('mouseenter', function () { show(i); });
      heads[i].addEventListener('focus', function () { show(i); });
      heads[i].addEventListener('click', function () { show(i); });
      heads[i].addEventListener('keydown', function (e) {
        if (!live) return;
        var n = pillars.length, next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = n - 1;
        if (next === null) return;
        e.preventDefault();
        heads[next].focus();
      });
    });
    // back to Regulatory Risk once the pointer leaves, unless the keyboard is still inside
    rail.addEventListener('mouseleave', function () {
      if (!rail.contains(document.activeElement)) show(REST);
    });
    rail.addEventListener('focusout', function (e) {
      if (!rail.contains(e.relatedTarget) && !rail.matches(':hover')) show(REST);
    });

    layout();
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    // the rail's height depends on the real faces, so re-measure once they are in
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  });

  /* ---------- maturity slider ----------
     The bar fills copper up to the chosen stage; that stage's column lights
     and the others dim. Clicking a column's name moves the slider there. */
  document.querySelectorAll('.cx-maturity').forEach(function (root) {
    var input = root.querySelector('.cx-range');
    var stages = Array.prototype.slice.call(root.querySelectorAll('.cx-stage'));
    if (!input || !stages.length) return;
    var set = function () {
      var v = parseInt(input.value, 10) || 0;
      stages.forEach(function (s, i) { s.classList.toggle('is-active', i === v); });
      var name = stages[v].querySelector('.cx-stage-name');
      input.setAttribute('aria-valuetext', 'Stage ' + (v + 1) + ' of ' + stages.length + ': ' + (name ? name.textContent : ''));
      input.style.setProperty('--cx-fill', (v / (stages.length - 1) * 100) + '%');
    };
    root.querySelectorAll('[data-cx-stage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.getAttribute('data-cx-stage');
        set();
      });
    });
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
      var consent = form.elements.consent;
      if (consent) consent.setAttribute('aria-invalid', String(!consent.checked));
      if (!name.value.trim()) errors.push('add your name');
      if (!EMAIL.test(email.value.trim())) errors.push('enter an email address like you@company.com');
      if (consent && !consent.checked) errors.push('tick the consent box');
      if (errors.length) {
        msg.textContent = 'To send this, ' + errors.join(' and ') + '.';
        (name.getAttribute('aria-invalid') === 'true' ? name : email.getAttribute('aria-invalid') === 'true' ? email : consent).focus();
        return;
      }
      msg.textContent = '';
      var val = function (n) { var f = form.elements[n]; if (!f) return ''; return f.tagName === 'SELECT' ? (f.value ? f.options[f.selectedIndex].text : '') : f.value.trim(); };
      // only the details that were filled in, then the message
      var body = [['Name', 'name'], ['Email', 'email'], ['Company', 'company'], ['Role', 'role'],
        ['Sector', 'sector'], ['Stage', 'stage'], ['Where to start', 'start']]
        .filter(function (f) { return val(f[1]); })
        .map(function (f) { return f[0] + ': ' + val(f[1]); })
        .concat(['', val('message'), '', 'GDPR consent: given on the website form on ' + new Date().toISOString().slice(0, 10)]).join('\n');
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
