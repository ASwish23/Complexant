/* ============================================================
   COMPLEXANT PARTNERS — shared shell script (cx-shell)
   Header scrim, mobile menu, services flyout and search panel for
   every page. The markup is written by tools/build-shell.py; each
   block does nothing when its hooks are absent.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- header scrim once the page has scrolled ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var stuck = function () { header.classList.toggle('is-stuck', window.scrollY > 40); };
    stuck();
    window.addEventListener('scroll', stuck, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var overlay = document.getElementById('overlay');
  var setMenu = function () {};
  if (menuBtn && overlay) {
    var label = menuBtn.querySelector('.menu-label');
    setMenu = function (open) {
      menuBtn.setAttribute('aria-expanded', String(open));
      // the visible label is hidden on phones in favour of an icon-only
      // button, so keep the accessible name in sync with it too
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (label) label.textContent = open ? 'Close' : 'Menu';
      overlay.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') !== 'true';
      if (open) setSearch(false);
      setMenu(open);
    });
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1000) setMenu(false); });
  }

  /* ---------- services flyout ----------
     Opens on hover and :focus-within in CSS; the button adds a click toggle
     for touch, and Escape closes it. */
  var flyWrap = document.querySelector('.nav-services');
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

  /* ---------- search panel ----------
     Filters the site's page list as you type. When nothing matches, the
     panel offers a way to reach a principal instead. */
  var searchBtn = document.getElementById('search-btn');
  var panel = document.getElementById('search-panel');
  var setSearch = function () {};
  if (searchBtn && panel) {
    var input = panel.querySelector('input');
    var results = Array.prototype.slice.call(panel.querySelectorAll('.search-results a'));
    var empty = panel.querySelector('.search-empty');
    var status = panel.querySelector('[role="status"]');

    var filter = function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      results.forEach(function (a) {
        var hit = !q || a.textContent.toLowerCase().indexOf(q) !== -1;
        a.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      if (status) status.textContent = shown ? shown + (shown === 1 ? ' page' : ' pages') : 'No pages match';
    };

    setSearch = function (open) {
      searchBtn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      if (open) {
        filter();
        // after the panel becomes visible, or focus has nowhere to land
        setTimeout(function () { input.focus(); }, 30);
      }
    };

    searchBtn.addEventListener('click', function () {
      var open = searchBtn.getAttribute('aria-expanded') !== 'true';
      if (open) setMenu(false);
      setSearch(open);
    });
    input.addEventListener('input', filter);
    // Enter goes to the first page still listed
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var first = results.filter(function (a) { return !a.hidden; })[0];
      if (first) { e.preventDefault(); window.location.href = first.getAttribute('href'); }
    });
    document.addEventListener('click', function (e) {
      if (searchBtn.getAttribute('aria-expanded') !== 'true') return;
      if (panel.contains(e.target) || searchBtn.contains(e.target)) return;
      setSearch(false);
    });
  }

  /* ---------- footer "Send us a message" ----------
     The button is a plain mailto: link, which hands over to whatever mail app
     the device has. A laptop with none set up gives no sign at all, so if the
     page still has focus a moment after the click, a note appears offering to
     copy the address instead. */
  var msgLink = document.querySelector('.footer-msg a');
  if (msgLink) {
    var address = msgLink.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
    var msgNote = null;
    var msgTimer = 0;

    var copyAddress = function (done) {
      var fallback = function () {
        var t = document.createElement('textarea');
        t.value = address;
        t.setAttribute('readonly', '');
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { /* leave ok false */ }
        document.body.removeChild(t);
        done(ok);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    };

    var showMsgNote = function () {
      msgNote = document.createElement('p');
      msgNote.className = 'footer-msg-note';
      msgNote.setAttribute('role', 'status');
      var text = document.createElement('span');
      text.textContent = 'Nothing opened? This device may not have a mail app set up. ';
      var copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'footer-copy';
      copy.textContent = 'Copy our address';
      copy.addEventListener('click', function () {
        copyAddress(function (ok) {
          text.textContent = ok ? address + ' is copied. Paste it into any mail app. ' : 'Write to ' + address + ' from any mail app. ';
          copy.hidden = true;
        });
      });
      msgNote.appendChild(text);
      msgNote.appendChild(copy);
      msgLink.parentNode.insertAdjacentElement('afterend', msgNote);
    };

    msgLink.addEventListener('click', function () {
      clearTimeout(msgTimer);
      msgTimer = setTimeout(function () {
        // a mail app opening takes focus from the page; no change means nothing opened
        if (!msgNote && !document.hidden && document.hasFocus()) showMsgNote();
      }, 1500);
    });
  }

  /* ---------- Escape closes whichever layer is open ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (panel && panel.classList.contains('is-open')) { setSearch(false); searchBtn.focus(); return; }
    if (overlay && overlay.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });
})();
