/* ============================================================
  COMPLEXANT PARTNERS — signal particle field (sub-pages)

  The home page's background, on every other page. The Signal's bars hold
  the mark in the hero, scatter across the whole viewport as you scroll
  (drifting and parallaxing), and regroup into the mark as the footer comes
  into view. Scrolling back up reverses each step.

  Same sprites ("Bar icon files"), same bar-by-bar logo map, same copper
  polish and passing light as index.html. The hero mark is sized to the
  page's own hero instead of the full viewport, since these heroes are
  shorter than the home page's.
  ============================================================ */
(function(){
  const spine = document.querySelector('.cx-spine');
  const signalCanvas = document.getElementById('cx-signal-canvas');
  if (!spine || !signalCanvas) return;
  const hero = document.querySelector('.cx-hero');
  const footer = document.querySelector('.cx-footer');
  const HEADER_H = 84;          // the fixed header, kept clear of the hero mark

  const sctx = signalCanvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- tunables ---- */
  // fraction of the hero's height scrolled: the mark starts letting go -> fully scattered
  const RELEASE_START = 0.06;
  const RELEASE_END   = 0.70;
  // fraction of the footer on screen: particles start regrouping -> mark fully formed
  const GATHER_START  = 0.20;
  const GATHER_END    = 0.92;
  /* Spread of per-particle start times, as a share of the transition. Nobody
     arrives at once, so the mark assembles instead of popping. */
  const STAGGER = 0.45;
  const FORM_EASE = 2.6;        // per second — how quickly formation catches up to scroll
  const ARC = 0.22;             // sideways swing of a migrating particle, share of the viewport
  const DRIFT = 0.010;          // free drift of a scattered particle, viewport per second
  const PARALLAX_NEAR = 0.34;   // scattered field's scroll parallax, near particles...
  const PARALLAX_FAR  = 0.08;   // ...and far ones
  const SCATTER_ALPHA = 0.38;   // scattered brightness relative to formed, keeps copy readable
  const YAW = 0;                // the formed mark rests square on, exactly as the logo is drawn
  const YAW_SWING = 0.12;       // and turns gently either side of that
  // the light that passes over the field and catches the copper
  const SWEEP_PERIOD = 7;       // seconds from one pass to the next
  const SWEEP_TIME = 2.6;       // seconds a pass takes to cross the viewport
  const SWEEP_SLOPE = 1.6;      // tilt of the light's edge: x + SLOPE*y = const
  const SWEEP_SOFT = 0.09;      // width of the lit band, share of the distance it travels
  const GLINT_RUN = 0.9;        // seconds of a bar's own occasional glint between passes
  /* ------------------ */

  const smoothstep = (a, b, t) => {
    const x = Math.min(Math.max((t - a) / (b - a), 0), 1);
    return x * x * (3 - 2 * x);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrap = (v, lo, hi) => { const s = hi - lo; return ((v - lo) % s + s) % s + lo; };

  function rand(seed){
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /* ---------- the bar sprites ----------
     Every particle is one of the shaded bar renders in "Bar icon files",
     grouped by finish. The copper gets a harder highlight plus a set of glint
     frames — the same bar lit by a warm band at a different height in each —
     so light can run along it. */
  const SPRITE_DIR = 'Bar%20icon%20files/';
  const FINISHES = {
    copper:     ['14x71', '18x94'],
    copperNavy: ['11x77', '13x102', '13x71', '14x62', '17x94', '18x83'],
    navy:       ['14x60', '18x80'],
    teal:       ['13x60', '18x79'],
    cream:      ['14x72', '18x95'],
    navyCream:  ['10x41', '13x55'],
    silver:     ['silver:14x72', 'silver:18x95'],   // made from the cream bars, see prepareSilver
  };
  const GLINT_FRAMES = 24;
  const GLINT_FROM = -0.35, GLINT_TO = 1.35;   // band centre along the bar, first frame to last
  const sprites = {};                          // name -> { base:[up, flipped], glint:[up[], flipped[]] | null }

  function canvasOf(w, h){
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function flipped(src){
    const c = canvasOf(src.width, src.height), g = c.getContext('2d');
    g.translate(0, src.height); g.scale(1, -1);
    g.drawImage(src, 0, 0);
    return c;
  }
  const isCopperPx = (r, g, b) => r > 110 && r - b > 55 && r - g > 28;
  // polished copper, dark to light; the body stop is the brand copper #C7742D
  const COPPER_STOPS = [[0, [74, 34, 14]], [0.42, [158, 84, 32]], [0.68, [199, 116, 45]], [0.88, [236, 166, 104]], [1, [252, 214, 176]]];
  // brushed silver for the logo's grey bars, cool rather than warm
  const SILVER_STOPS = [[0, [66, 69, 72]], [0.4, [110, 113, 116]], [0.7, [162, 165, 168]], [0.9, [206, 208, 210]], [1, [234, 235, 236]]];
  function ramp(stops, s){
    let k = 1;
    while (k < stops.length - 1 && s > stops[k][0]) k++;
    const [a, ca] = stops[k - 1], [b, cb] = stops[k];
    const f = Math.min(Math.max((s - a) / (b - a), 0), 1);
    return [lerp(ca[0], cb[0], f), lerp(ca[1], cb[1], f), lerp(ca[2], cb[2], f)];
  }

  /* Polish the metal pixels (those in `mask`): re-map their own shading onto
     a polished ramp — deep shadow, body, bright edge — with a steeper curve
     than the render's soft one, then a hot specular line down the lit side.
     Returns how lit each column is, 0..1, for the glint frames. */
  function polish(px, w, h, mask, stops, spec){
    const col = new Float32Array(w), colW = new Float32Array(w);
    let lLo = Infinity, lHi = 0;
    for (let i = 0; i < w * h; i++) if (mask[i]){
      const l = px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11;
      col[i % w] += l * mask[i]; colW[i % w] += mask[i];
      lLo = Math.min(lLo, l); lHi = Math.max(lHi, l);
    }
    let lo = Infinity, hi = 0;
    for (let x = 0; x < w; x++) if (colW[x]){ col[x] /= colW[x]; lo = Math.min(lo, col[x]); hi = Math.max(hi, col[x]); }
    for (let x = 0; x < w; x++) col[x] = colW[x] ? (col[x] - lo) / Math.max(hi - lo, 1) : 0;
    for (let i = 0; i < w * h; i++){
      if (!mask[i]) continue;
      const l = (px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11 - lLo) / Math.max(lHi - lLo, 1);
      const rgb = ramp(stops, smoothstep(0.08, 0.95, l));
      const s = Math.pow(col[i % w], 4) * spec;
      px[i * 4]     = Math.min(255, rgb[0] + (255 - rgb[0]) * s);
      px[i * 4 + 1] = Math.min(255, rgb[1] + (243 - rgb[1]) * s);
      px[i * 4 + 2] = Math.min(255, rgb[2] + (226 - rgb[2]) * s);
    }
    return col;
  }

  // the sprite at 2x, so the specular line can be narrower than a source pixel
  function upscale(img){
    const w = img.naturalWidth * 2, h = img.naturalHeight * 2;
    const c = canvasOf(w, h), g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, w, h);
    return c;
  }
  const plain = (c) => ({ base: [c, flipped(c)], glint: null });

  function prepare(img){
    const base = upscale(img), bg = base.getContext('2d'), w = base.width, h = base.height;
    let data;
    try { data = bg.getImageData(0, 0, w, h); }
    catch (err){ return plain(base); }   // tainted (file://): plain bars, no polish or glint

    const px = data.data, mask = new Float32Array(w * h);
    let copperPx = 0;
    for (let i = 0; i < w * h; i++){
      const a = px[i * 4 + 3] / 255;
      if (a > 0.05 && isCopperPx(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])){ mask[i] = a; copperPx++; }
    }
    if (!copperPx) return plain(base);
    const col = polish(px, w, h, mask, COPPER_STOPS, 0.6);
    bg.putImageData(data, 0, 0);

    // glint frames: warm light on the copper only, strongest down the lit side
    const up = [], down = [];
    for (let f = 0; f < GLINT_FRAMES; f++){
      const u = lerp(GLINT_FROM, GLINT_TO, f / (GLINT_FRAMES - 1));
      const c = canvasOf(w, h), g = c.getContext('2d');
      const out = g.createImageData(w, h), o = out.data;
      for (let y = 0; y < h; y++){
        const band = Math.exp(-Math.pow((y / h - u) / 0.15, 2));
        for (let x = 0; x < w; x++){
          const i = y * w + x;
          if (!mask[i]) continue;
          const k = col[x];
          o[i * 4] = 255; o[i * 4 + 1] = 228; o[i * 4 + 2] = 196;
          o[i * 4 + 3] = 255 * mask[i] * Math.min(1, 0.25 * k + band * (0.65 + 0.35 * k));
        }
      }
      g.putImageData(out, 0, 0);
      up.push(c);
      down.push(flipped(c));
    }
    return { base: [base, flipped(base)], glint: [up, down] };
  }

  // silver, made from a cream bar: the whole bar re-mapped onto the silver ramp
  function prepareSilver(img){
    const base = upscale(img), bg = base.getContext('2d'), w = base.width, h = base.height;
    let data;
    try { data = bg.getImageData(0, 0, w, h); }
    catch (err){ return plain(base); }
    /* The cream bar is lit almost evenly, so the silver takes its cylinder
       from position instead, as the logo's silver bars are drawn: dark grey
       on the left rising to bright on the right, a little of the bar's own
       shading kept for its rounded ends and edges. */
    const px = data.data;
    for (let i = 0; i < w * h; i++){
      if (px[i * 4 + 3] <= 12) continue;
      const l = (px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11) / 255;
      const across = smoothstep(0.02, 0.8, ((i % w) + 0.5) / w);
      const rgb = ramp(SILVER_STOPS, Math.min(1, across * (0.55 + 0.45 * l)));
      px[i * 4] = rgb[0]; px[i * 4 + 1] = rgb[1]; px[i * 4 + 2] = rgb[2];
    }
    bg.putImageData(data, 0, 0);
    return plain(base);
  }

  // the soft warm flare where the light strikes a copper bar
  const bloom = canvasOf(64, 64);
  {
    const g = bloom.getContext('2d');
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255, 236, 212, 0.9)');
    rg.addColorStop(0.25, 'rgba(240, 168, 104, 0.35)');
    rg.addColorStop(1, 'rgba(199, 116, 45, 0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 64, 64);
  }

  const files = [...new Set(Object.values(FINISHES).flat().map((n) => n.replace('silver:', '')))];
  const spritesReady = Promise.all(files.map((name) => new Promise((done) => {
    const img = new Image();
    img.onload = () => {
      sprites[name] = prepare(img);
      if (FINISHES.silver.includes('silver:' + name)) sprites['silver:' + name] = prepareSilver(img);
      done();
    };
    img.onerror = done;
    img.src = SPRITE_DIR + name + '.png';
  })));

  /* A bar at any size without stretching its rounded ends: the two caps are
     drawn at the bar's width, only the straight middle is stretched. */
  function drawBar(src, cx, top, w, h){
    const sw = src.width, sh = src.height, sc = sw * 0.5;
    const dc = Math.min(w * 0.5, h * 0.5);
    const x = cx - w * 0.5;
    sctx.drawImage(src, 0, 0, sw, sc, x, top, w, dc);
    sctx.drawImage(src, 0, sc, sw, sh - 2 * sc, x, top + dc, w, h - 2 * dc);
    sctx.drawImage(src, 0, sh - sc, sw, sc, x, top + h - dc, w, dc);
  }

  /* ---------- build the particle field (the Signal) ----------
     The formed mark is the logo itself (assets/signal.png), measured bar by
     bar: [centre x, width, top y, height, segments] in the logo's 512px
     space. Segments run top to bottom, finish letter + length in px:
     K copper, N navy, T teal, W cream, S silver. Each segment is one
     particle, so a line in the logo is a stack of bars, as it is drawn. */
  const LOGO_BARS = [
    [180, 6, 0, 39, 'S39'], [238.5, 7, 41, 68, 'S68'],
    [326, 8, 59, 407, 'T12 N59 T49 S49 T12 K44 T8 N61 T46 S48 T19'],
    [179.5, 7, 64, 23, 'T23'], [206.5, 7, 89, 41, 'S41'], [136.5, 7, 94, 24, 'T24'],
    [272.5, 7, 97, 66, 'T66'], [342, 8, 97, 330, 'T13 S49 T56 K94 T38 N38 T42'],
    [75, 6, 102, 24, 'T24'], [308, 8, 126, 274, 'S5 W35 T84 K25 T51 N39 T35'],
    [238, 8, 130, 64, 'K21 N43'], [358, 6, 132, 261, 'T14 N45 T11 K121 T9 W29 T32'],
    [154.5, 7, 138, 41, 'S41'], [91.5, 5, 161, 46, 'T18 N28'],
    [372, 6, 162, 201, 'T6 W13 T7 K149 T7 N12 T7'], [197, 6, 167, 52, 'N21 W31'],
    [255, 6, 177, 52, 'N21 W31'], [44, 6, 179, 23, 'T23'],
    [286, 8, 186, 152, 'T16 N32 T21 K14 T23 W36 T10'], [386, 6, 188, 148, 'S16 K116 W16'],
    [399, 4, 208, 108, 'N11 T7 K77 S6 T7'], [267.5, 5, 217, 63, 'T35 N28'],
    [119.5, 7, 219, 24, 'T24'], [409, 4, 226, 72, 'T8 K57 T7'], [209, 8, 227, 47, 'S21 N26'],
    [150.5, 7, 239, 46, 'W20 N26'], [88.5, 5, 240, 38, 'T14 N24'], [177, 6, 240, 31, 'T14 N17'],
    [417.5, 3, 240, 45, 'K45'], [241.5, 7, 241, 62, 'K20 N42'], [424.5, 3, 245, 35, 'K35'],
    [429, 2, 248, 29, 'K29'], [433, 2, 251, 22, 'K22'],
    // the arrowhead at the point
    [439, 4, 253, 19, 'K19'], [445, 3, 255, 14, 'K14'], [450, 3, 256, 12, 'K12'],
    [454, 2, 257, 9, 'K9'], [458, 2, 259, 6, 'K6'],
    [119.5, 7, 280, 29, 'S17 N12'], [264, 6, 295, 45, 'N20 W25'], [190, 6, 300, 48, 'N20 W28'],
    [46.5, 7, 311, 23, 'T23'], [221, 6, 323, 94, 'N20 W74'], [104.5, 7, 330, 42, 'S42'],
    [157.5, 7, 335, 62, 'T25 N37'], [271, 6, 350, 29, 'S29'], [271, 6, 387, 47, 'N20 W27'],
    [199.5, 7, 403, 44, 'K6 N38'], [74, 6, 425, 33, 'S33'], [177.5, 7, 445, 67, 'T67'],
    [237.5, 7, 449, 33, 'S33'],
  ];
  // the copper needle the lines converge on: from x to x, centre y, thickness
  const LOGO_NEEDLE = [282, 472, 261.5, 5];
  const LOGO_CX = 256, LOGO_CY = 261.5, LOGO_R = 256;   // logo px -> mark units
  const LETTER = { K: 'copper', N: 'navy', T: 'teal', W: 'cream', S: 'silver' };
  /* Scatter-only bars: they fill out the field mid-page and fade away as the
     mark forms, so the mark itself stays exactly the logo. */
  const EXTRA = 110;

  const points = [];
  let id = 0;
  const finishOf = (finish) => {
    const names = FINISHES[finish];
    return { finish, sprite: names[Math.floor(rand(id * 8.2) * names.length)], metal: finish === 'copper' || finish === 'copperNavy' };
  };

  for (let i = 0; i < EXTRA; i++){
    id++;
    const r = rand(id * 5.9);
    const finish = r < 0.04 ? 'copper' : r < 0.07 ? 'copperNavy'
      : ['navy', 'teal', 'cream', 'navyCream', 'silver'][Math.floor(rand(id * 6.3) * 5)];
    points.push({
      x: (rand(id * 2.1) * 2 - 1) * 0.8, y: (rand(id * 1.3) * 2 - 1) * 0.9,
      len: 0.05 + rand(id * 4.4) * 0.09, wid: 6 / LOGO_R,
      ghost: true, flip: rand(id * 9.4) > 0.5 ? 1 : 0, ...finishOf(finish),
    });
  }
  for (const [bx, bw, by, , runs] of LOGO_BARS){
    let cursor = by;
    for (const seg of runs.split(' ')){
      id++;
      const n = parseFloat(seg.slice(1));
      points.push({
        x: (bx - LOGO_CX) / LOGO_R, y: (cursor + n * 0.5 - LOGO_CY) / LOGO_R,
        len: n / LOGO_R, wid: bw / LOGO_R, flip: 0, ...finishOf(LETTER[seg[0]]),
      });
      cursor += n;
    }
  }
  {
    // last, so it lies across the lines it threads, as in the logo
    id++;
    const [x0, x1, cy, t] = LOGO_NEEDLE;
    points.push({
      x: ((x0 + x1) * 0.5 - LOGO_CX) / LOGO_R, y: (cy - LOGO_CY) / LOGO_R,
      len: (x1 - x0) / LOGO_R, wid: t / LOGO_R, flip: 0, horiz: true, ...finishOf('copper'),
    });
  }
  // every bar is fully opaque in the mark; scattered, each keeps its own brightness
  points.forEach((p, n) => { p.alpha = p.metal ? 0.9 + rand(n * 7.1) * 0.1 : 0.55 + rand(n * 7.1) * 0.4; });

  /* ---------- give every particle a seat in the scattered field ----------
     Seats come from the R2 low-discrepancy sequence, lightly jittered, so the
     field reads as random but covers the whole viewport evenly — no clumps, no
     empty quarters. */
  points.forEach((p, n) => {
    p.hx = wrap(0.5 + n * 0.7548776662 + (rand(n * 13.1) - 0.5) * 0.05, 0, 1);
    p.hy = wrap(0.5 + n * 0.5698402910 + (rand(n * 14.7) - 0.5) * 0.05, 0, 1);
    p.near = rand(n * 15.3);                         // 0 far .. 1 near
    p.vx = (rand(n * 16.9) - 0.5) * 2 * DRIFT;
    p.vy = (rand(n * 17.2) - 0.5) * 2 * DRIFT;
    p.wob = 0.3 + rand(n * 18.4) * 0.7;              // wobble rate
    p.delay = rand(n * 19.8) * STAGGER;
    p.arcX = (rand(n * 20.3) - 0.5) * 2 * ARC;
    p.arcY = (rand(n * 21.6) - 0.5) * 2 * ARC;
    p.slen = 0.03 + rand(n * 11.8) * 0.07;
    p.phase = rand(n * 12.9) * Math.PI * 2;          // desynchronised shimmer
    p.gper = 8 + rand(n * 22.7) * 7;                 // seconds between its own glints
  });

  /* ---------- sizing ---------- */
  let W = 0, H = 0, dpr = 1;
  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = spine.clientWidth;
    H = spine.clientHeight;
    signalCanvas.width = Math.round(W * dpr);
    signalCanvas.height = Math.round(H * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  /* ---------- where the marks sit ----------
     The hero mark takes the right-hand lane of the hero (52vw wide on desktop,
     78% below 1100px), centred 44% into it and faded towards its left edge.
     It is sized to the hero's own height and lifts gently as the page scrolls.
  */
  function heroAnchor(){
    const box = W * (W >= 1100 ? 0.52 : 0.78);
    // a tall hero (the contact form lives inside its hero) counts as one screen,
    // so the mark always sits in the first view
    const heroH = Math.min(hero ? hero.offsetHeight : H, H);
    const area = Math.max(heroH - HEADER_H, 240);
    return {
      cx: W - box + box * 0.44,
      cy: HEADER_H + area * 0.5 - Math.min(window.scrollY, heroH) * 0.4,
      scale: Math.min(box, area * 1.05) * 0.46,
      right: W, box,
    };
  }
  /* The footer mark sits in the left region the footer grid reserves for it
     (its padding-left), tail on the left and the tapered point aimed right at
     the links — it reads as an arrow towards "Let's talk". Sized from that
     region so the mark and the copy beside it can't drift apart. */
  function footerAnchor(){
    if (!footer) return { cx: W * 0.5, cy: H * 0.5, scale: Math.min(W, H) * 0.3, right: W * 0.7, box: W * 0.5 };
    const r = footer.getBoundingClientRect();
    const grid = footer.querySelector('.cx-footer-grid');
    const g = grid ? grid.getBoundingClientRect() : r;
    const region = grid ? (parseFloat(getComputedStyle(grid).paddingLeft) || 0) : 0;
    let cx, cy, scale;
    if (W >= 900 && region > 0){
      cx = g.left + region * 0.46;
      cy = g.top + g.height * 0.5;
      scale = Math.min(region * 0.46, g.height * 0.62, H * 0.32);
    } else {
      // stacked footer: no spare column, so a small mark behind the copy
      cx = W * 0.5;
      cy = r.top + r.height * 0.5;
      scale = Math.min(W * 0.28, r.height * 0.4);
    }
    // the tail fades out towards the left
    return { cx, cy, scale, right: cx + scale * 0.9, box: scale * 1.9 };
  }
  /* The mark's fade as a function of screen x: solid over the right third,
     0.65 at two-thirds across, gone at the left edge. */
  function boxMask(sx, a){
    const r = (a.right - sx) / a.box;
    if (r <= 0.34) return 1;
    if (r <= 0.68) return lerp(1, 0.65, (r - 0.34) / 0.34);
    if (r <= 1) return lerp(0.65, 0, (r - 0.68) / 0.32);
    return 0;
  }

  /* ---------- state ---------- */
  let heroForm = 1, footForm = 0;     // eased, 0..1
  let clock = 0;                      // drives drift and shimmer; scrolling speeds it up
  let drive = 0;                      // scroll energy, 0..1, bleeds off
  let lastScroll = window.scrollY;
  let lastT = performance.now();

  function targets(){
    let heroT = 0;
    if (hero){
      const heroH = Math.min(hero.offsetHeight, H);
      heroT = 1 - smoothstep(RELEASE_START, RELEASE_END, window.scrollY / Math.max(heroH, 1));
    }
    let footT = 0;
    if (footer){
      const r = footer.getBoundingClientRect();
      const seen = (H - r.top) / Math.max(Math.min(r.height, H), 1);
      footT = smoothstep(GATHER_START, GATHER_END, seen);
    }
    return { heroT, footT };
  }

  /* ---------- render ---------- */
  function render(){
    sctx.clearRect(0, 0, W, H);
    if (!W || !H) return;
    sctx.imageSmoothingQuality = 'high';   // the sprites draw well below their size; low quality skips the highlight

    const form = Math.max(heroForm, footForm);
    // which mark the particles are heading for — normally only one is live
    const toFoot = footer && (heroForm + footForm) > 0 ? footForm / (heroForm + footForm) : 0;
    const hA = heroAnchor();
    const fA = footer ? footerAnchor() : hA;

    const yaw = YAW + Math.sin(clock * 0.09) * YAW_SWING;
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const FOV = 2.6;
    const span = Math.min(W, H);
    const scrollY = window.scrollY;
    const M = 40;                     // wrap margin, px

    // where the passing light is: a tilted edge, x + SLOPE*y = sweepS, moving
    // from top-left to bottom-right, then resting off-screen until the next pass
    const reach = W + SWEEP_SLOPE * H;
    const soft = SWEEP_SOFT * reach;
    const pass = (clock % SWEEP_PERIOD) / SWEEP_TIME;
    const sweepS = lerp(-soft * 2, reach + soft * 2, pass);

    for (let i = 0; i < points.length; i++){
      const p = points[i];
      const sprite = sprites[p.sprite];
      if (!sprite) continue;
      // this particle's own progress through the transition, offset by its delay
      const e = smoothstep(p.delay, p.delay + 1 - STAGGER, form);

      /* --- formed position, projected through the slowly swaying yaw --- */
      const rx = p.x * cos;
      const rz = p.x * sin;
      const persp = FOV / (FOV + rz);
      const lxH = hA.cx + rx * hA.scale * persp, lyH = hA.cy + p.y * hA.scale * persp;
      const lxF = fA.cx + rx * fA.scale * persp, lyF = fA.cy + p.y * fA.scale * persp;
      const lx = lerp(lxH, lxF, toFoot), ly = lerp(lyH, lyF, toFoot);
      const lscale = lerp(hA.scale, fA.scale, toFoot);
      // on wide screens the mark has its own column; narrower, it sits behind
      // the copy and fades out towards the left
      const mask = W >= 1100 ? 1 : lerp(boxMask(lxH, hA), boxMask(lxF, fA), toFoot);

      /* --- scattered position: its seat, drifting, parallaxed by scroll,
             wrapped round the viewport edges --- */
      const par = lerp(PARALLAX_FAR, PARALLAX_NEAR, p.near);
      const dx = (p.vx * clock + Math.sin(clock * 0.21 * p.wob + p.phase) * 0.018) * W;
      const dy = (p.vy * clock + Math.cos(clock * 0.17 * p.wob + p.phase) * 0.018) * H;
      const sx = wrap(p.hx * W + dx, -M, W + M);
      const sy = wrap(p.hy * H + dy - scrollY * par, -M, H + M);
      const edge = smoothstep(-M, M * 0.5, sx) * (1 - smoothstep(W - M * 0.5, W + M, sx))
                 * smoothstep(-M, M * 0.5, sy) * (1 - smoothstep(H - M * 0.5, H + M, sy));

      /* --- migrate between the two, swinging out along a curve rather than
             sliding in a straight line --- */
      const swing = Math.sin(Math.PI * e) * span;
      const px = lerp(sx, lx, e) + p.arcX * swing;
      const py = lerp(sy, ly, e) + p.arcY * swing;

      // formed, every bar takes its exact size from the logo
      const formedLen = p.len * lscale * persp;
      const looseLen = p.slen * span * 0.46 * (0.7 + p.near * 0.6) * (1 + drive * 0.7);
      const bw = lerp(2.6 + p.near * 3.4, Math.max(1.5, p.wid * lscale * persp), e);
      const bh = Math.max(lerp(looseLen, formedLen, e), bw * lerp(1.6, 1, e));
      // the needle swings from upright, like every scattered bar, to lying across the lines
      const ang = p.horiz ? e * Math.PI * 0.5 : 0;

      // scattered, the matte bars breathe; formed, the logo holds solid
      const shimmer = p.metal ? 1 : lerp(0.84 + 0.16 * Math.sin(clock * 0.1 + p.phase), 1, e);
      const formedA = p.ghost ? 0 : mask;
      const looseA = p.alpha * SCATTER_ALPHA * (0.45 + p.near * 0.55) * edge;
      const alpha = lerp(looseA, formedA, e) * shimmer;
      if (alpha < 0.01) continue;

      // drawn in the bar's own frame: centred on (px, py), long axis down
      if (ang) sctx.setTransform(dpr * Math.cos(ang), dpr * Math.sin(ang), -dpr * Math.sin(ang), dpr * Math.cos(ang), dpr * px, dpr * py);
      else sctx.setTransform(dpr, 0, 0, dpr, dpr * px, dpr * py);
      sctx.globalAlpha = alpha;
      drawBar(sprite.base[p.flip], 0, -bh * 0.5, bw, bh);

      if (sprite.glint){
        /* --- light on the copper: the passing sweep, or between passes the
               bar's own brief glint; whichever is brighter right now --- */
        let gk = 0, gu = 0.5;
        if (pass < 1){
          const d = (px + SWEEP_SLOPE * py - sweepS) / soft;
          gk = Math.exp(-d * d);
          // where the light's edge crosses this bar, 0 at its top end .. 1 at its bottom
          const ax = -Math.sin(ang), ay = Math.cos(ang);
          const t0 = (px - ax * bh * 0.5) + SWEEP_SLOPE * (py - ay * bh * 0.5);
          gu = (sweepS - t0) / (bh * (ax + SWEEP_SLOPE * ay));
        }
        const own = ((clock + p.phase * 10) % p.gper) / GLINT_RUN;
        if (own < 1 && Math.sin(Math.PI * own) * 0.8 > gk){
          gk = Math.sin(Math.PI * own) * 0.8;
          gu = lerp(GLINT_FROM, GLINT_TO, own);
        }
        if (gk >= 0.02){
          let f = Math.round((Math.min(Math.max(gu, GLINT_FROM), GLINT_TO) - GLINT_FROM)
                             / (GLINT_TO - GLINT_FROM) * (GLINT_FRAMES - 1));
          if (p.flip) f = GLINT_FRAMES - 1 - f;   // flipped frames hold the band mirrored
          sctx.globalCompositeOperation = 'lighter';
          sctx.globalAlpha = alpha * gk;
          drawBar(sprite.glint[p.flip][f], 0, -bh * 0.5, bw, bh);
          if (gu > 0 && gu < 1){
            const rad = Math.max(bw, 3) * 3.2;
            sctx.globalAlpha = alpha * gk * 0.55 * Math.sin(Math.PI * gu);
            sctx.drawImage(bloom, -rad, -bh * 0.5 + gu * bh - rad, rad * 2, rad * 2);
          }
          sctx.globalCompositeOperation = 'source-over';
        }
      }
    }
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.globalAlpha = 1;
  }

  function frame(now){
    // everything advances on elapsed time, so the field runs at the same speed
    // on a 60Hz panel and a 120Hz one
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    const y = window.scrollY;
    // saturating, so a flick and a fling feel related
    drive = Math.min(1, drive + Math.min(Math.abs(y - lastScroll), 90) / 90);
    lastScroll = y;
    drive *= Math.pow(0.2, dt);                  // bleeds off over ~1.3s

    const { heroT, footT } = targets();
    const k = 1 - Math.exp(-FORM_EASE * dt);
    heroForm += (heroT - heroForm) * k;
    footForm += (footT - footForm) * k;
    clock += dt * (1 + drive * 2.2);             // scrolling hurries the drift along

    render();
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  spritesReady.then(render);

  if (reduced){
    // no autonomous motion: snap to the scroll state and redraw only on scroll
    const still = () => {
      const { heroT, footT } = targets();
      heroForm = heroT; footForm = footT;
      render();
    };
    still();
    window.addEventListener('scroll', still, { passive: true });
  } else {
    const { heroT, footT } = targets();
    heroForm = heroT; footForm = footT;          // start in place, not mid-flight
    requestAnimationFrame(frame);
  }
})();
