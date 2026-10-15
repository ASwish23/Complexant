# PORT-SPEC: Adding the Complexant site's features to an existing website

Written for: an AI coding agent that will add new pages, styles and interactive behaviors to a plain HTML/CSS/JS website that already exists and is live.

---

## 0. Prime directive (read first)

1. **Additive only.** Create new files and new pages. Do not edit, rename, move or delete any existing file: pages, CSS, JS, images or copy.
2. **Ask before touching shared files.** Anything shared across pages (the header, footer, global stylesheet, global script, `<head>` blocks) needs the user's approval first. Propose the exact diff and wait.
3. **Namespace everything you add.** Prefix every class, id, CSS custom property and JS global with `cx-`. This prevents collisions with the existing site.
   - New stylesheet: `assets/css/cx-port.css`
   - New script: `assets/js/cx-port.js`
   - New pages: names the user approves, using their existing URL conventions.
4. **Audit before building.** Your first output is a short report covering the existing site's stack, page list, nav markup, colors, fonts, breakpoints and any build step. Wait for the user to confirm it before you create anything.
5. **Mark uncertainty.** Where this spec and the existing site disagree, follow the existing site and flag the difference.

---

## 1. Source site overview (what you are porting from)

- **Stack:** static HTML5, one stylesheet, one script. No framework, no bundler, no npm. Fonts from Google Fonts only.
- **Pages (10):** Home, Our Approach, Who We Serve, About, four service pages (Regulatory Risk, Sandbox, Implementation, Monitoring), Insights, Contact.
- **Layout:** each page has a skip link, a fixed decorative background layer, a sticky header, `<main id="main">`, a footer, and one `<script defer>` at the end.
- **Design:** dark-only. No theme toggle.

Port the **patterns** below. Do not copy the copy or wording. Replace every placeholder with the user's content.

---

## 2. Design language

### 2.1 Tokens (define as CSS custom properties in `cx-port.css`)

```css
:root {
  --cx-bg: #07131D;          /* deep navy page background */
  --cx-ink: #F6F3ED;         /* warm ivory primary text */
  --cx-teal-pale: #B7D6D2;   /* links, eyebrows, accents */
  --cx-teal: #4F8F8E;        /* eyebrows, dashes, borders */
  --cx-teal-mid: #3A7481;    /* gradients, orbs */
  --cx-teal-deep: #235A74;   /* buttons, panels */
  --cx-silver: #A6ACB2;      /* muted text, hairlines */
  --cx-copper: #C7742D;      /* highlight and primary CTA */
  --cx-copper-dark: #8E4E1C;
  --cx-copper-light: #EFB67E;
  --cx-select-bg: #1A2F3D;
  --cx-card: rgba(12,33,48,.5);   /* glass card surface, blur 10px */
  --cx-panel: rgba(14,38,54,.62); /* form panels */
}
```

Text is usually ivory at 0.7–0.88 opacity. Hairlines are silver at 0.12–0.4 opacity.

**If the existing site already has a brand palette, map these tokens to it** rather than adding a second palette. Ask the user first (see section 9).

### 2.2 Typography
- Headings: **Cormorant Garamond**, weight 600 (500 for H2). This is a stand-in for the licensed brand font. Keep it behind one `@font-face` swap point.
- Body: **Poppins**, weights 300–600.
- H1 (home): `clamp(2.8rem, 5.2vw, 4.8rem)`. H1 (sub-pages): `clamp(2.6rem, 5vw, 4.4rem)`. H2: `clamp(2.2rem, 4vw, 3.5rem)`.
- Eyebrow: 12px, uppercase, `letter-spacing: .24em`, weight 600, teal-pale, preceded by a 28px rule.
- Body: 14.5–19px, line-height 1.6–1.75.

### 2.3 Layout
- Container: `max-width: 1280px`, horizontal padding 32px.
- Section vertical padding: 90–110px.
- Grids: `repeat(auto-fit, minmax(min(100%, 250–340px), 1fr))`, gaps 14–24px.
- Radii: cards 16–26px, pills 999px.
- Breakpoints: **980px** (mobile nav, flyout becomes static), **640px** (reduced padding, search hidden).

### 2.4 Components to build (all in `cx-port.css`)
- **Copper button** (`.cx-btn`): copper metallic gradient `linear-gradient(110deg,#8E4E1C,#C7742D,#EFB67E,#C7742D,#8E4E1C)`, with a shimmer sweep on hover.
- **Ghost button** (`.cx-ghost`): outlined pill, teal tint on hover.
- **Text link** (`.cx-lnk`): with an arrow that slides on hover.
- **Glass card** (`.cx-card`): `--cx-card` surface, blur 10px, a radial spotlight following the cursor (see 4.3), a thin top sweep line, lift on hover. Variants: `.cx-flat` (no lift), `.cx-dashed` (dashed border, used for "coming soon"), `.cx-tile`, `.cx-pillar`, `.cx-metric`.
- **CTA band:** a bordered rounded container with a faint decorative SVG, an H2, and two buttons (copper and ghost).
- **Pill/chip** (`.cx-chip`): used for status labels and filter/tab controls.
- **Breadcrumb** on every sub-page.
- **Eyebrow + H1 + lede** hero block for sub-pages.

### 2.5 Reduced motion
Wrap all animation in `@media (prefers-reduced-motion: no-preference)`. Under reduced motion: reveal elements are visible immediately, the signal visualization renders in its final state, and counters show their final values.

### 2.6 Focus and accessibility
- `:focus-visible` outline in teal-pale on every interactive element.
- Skip link as the first focusable element.
- ARIA roles on tabs; `aria-live` on counters and sliders; `aria-invalid` on invalid form fields.

---

## 3. Page templates to add

For each, write the structure first and leave content as `[placeholder]`. Ask the user which of these they want before building.

### 3.1 Home-style landing page
Sections, in order:
1. **Hero:** eyebrow, two-line H1 (second line italic), lede, two CTAs, a tagline row of three words separated by dots, and the interactive signal visualization on the right (see 4.2). A "scroll" cue at the bottom.
2. **Purpose:** eyebrow, H2, a large gradient-text line, three glass cards each with an icon and a one-line description.
3. **Pillars / offerings:** H2, four tall cards (min-height 430px) with a number, icon, title and tagline. Hovering, focusing or tapping reveals a bullet list and grows a bar along the bottom. Use a dashed style for items not yet available, with a "Coming soon" chip.
4. **Feature panel:** a large gradient panel with a decorative SVG and a headline.
5. **Why us:** four glass cards, plus a metrics row with count-up numbers (see 4.5).
6. **Audience tiles:** five tiles, each with an animated dash line.
7. **Stakeholder cards:** three cards addressing the people who sign off.
8. **Team:** two person cards with grayscale headshot placeholders that turn to colour on hover.
9. **Insights teaser:** three cards linking to the insights page.
10. **Contact:** a form panel (see 4.10).

### 3.2 Process / approach page
- H1 and a "who does what" split: two cards side by side.
- A **vertical timeline** of four steps with a progress line that fills as you scroll (see 4.6).
- Three principles in cards.
- A numbered "how it runs" list of four steps.
- CTA band.

### 3.3 Audience page
- Sector tiles (five).
- **Role tabs:** an ARIA tablist with arrow-key navigation (see 4.7). Each panel has "the question you answer for" and "how we help", plus a link.
- **Maturity slider:** a range input with five stages. Stage data lives in a `data-stages` JSON attribute. The stage name and description update, and five bars animate to new heights (see 4.8).
- Stakeholder cards.
- CTA band.

### 3.4 About page
- Mission and purpose cards.
- **Person cards** (`.cx-person`): headshot placeholder, title, bio, skill chips, a collapsible full bio (see 4.9), and download/profile buttons. Hovering one card dims its sibling.
- Motto row and values list.
- CTA band.

### 3.5 Service / offering detail template (reuse for each offering)
- Hero with a "Pillar 0X of 04" style label, H1, and a summary card containing a number, icon, tagline and status chips.
- **Switcher row:** links to all sibling offerings, with `aria-current="page"` on the current one.
- **Inclusions grid:** numbered glass cards, plus an "Outcome" callout.
- Optional dashed "tool preview" block with a disabled button.
- **FAQ accordion** (see 4.9). Include matching `FAQPage` JSON-LD.
- Previous/next cards.
- CTA band: "Talk to us about [offering]."

### 3.6 Insights / articles page
- Featured article card.
- **Filter chips** (see 4.7) with a live count ("7 articles").
- Grid of article cards, each with a `data-category` attribute.
- CTA band.

### 3.7 Contact page
- H1, a "what happens next" three-step list, a contact details card.
- Full form (see 4.10), with fields: name*, email*, company, role, sector select, stage select, "where to start" select, message textarea.
- Privacy notice placeholder.

---

## 4. Interactive features catalogue

Each entry gives the behavior, the DOM hooks it needs, and the reference implementation in `assets/js/site.js`. Port the logic into `cx-port.js`. Scope every selector to `.cx-` classes or `data-cx-` attributes, not generic tags.

### 4.1 Living background
- **What:** four blurred radial-gradient "orbs" drift slowly (42s and 54s animations). About 96 thin vertical "motes" are scattered across a full-page layer. Every 24th mote is copper, the rest are teal and silver.
- **Hooks:** a container `.cx-field`, and orb elements `.cx-orb`.
- **Behavior:** placement uses a **seeded PRNG** (seed 29), so the layout is the same on every load. On scroll, the field translates and rotates very slightly (parallax).
- **Reference:** the mote generator and parallax in `site.js` (search for `#field`, `seeded`).

### 4.2 Hero "signal" visualization
- **What:** 66 vertical bars on the hero's right side. 24 are scattered noise bars. 42 form a tapering "spindle" ending in a copper needle with a pulsing tip.
- **Behavior:** a value `t` from 0 to 1 moves each bar between a scattered position and an ordered position. Scrolling down drives `t` toward 1. Scrolling up scatters it again, and it settles after 700ms. The needle fades in when `t` passes 0.7. While unconverged, bars jitter every 2.6s.
- **Reduced motion:** render statically at `t = 1`.
- **Hooks:** a container `.cx-signal`, with a height reduced to 340px at 640px.
- **Reference:** search for `#signal` in `site.js`.
- **Note:** this is the signature visual. Port it only if the user asks for it. It is the most complex feature.

### 4.3 Cursor spotlight on cards
- A global `mousemove` handler sets `--mx` and `--my` on the nearest `.cx-card` so a radial highlight follows the cursor.
- The handler runs inside `requestAnimationFrame` and is passive.

### 4.4 Scroll reveal
- Elements with `.cx-rv` gain `data-in` when they enter the viewport, via `IntersectionObserver`. The CSS fades them in and slides them up.
- Fallback: if `IntersectionObserver` is missing or reduced motion is on, show everything immediately.

### 4.5 Count-up metrics
- Elements with `data-cx-count="N"` start at 0 and count up to N over about 1.2s with a cubic ease-out. The animation starts when the metrics row enters the viewport.
- Use `aria-live="polite"` on the row if the values update dynamically.

### 4.6 Process timeline scroll-spy
- A vertical list of `.cx-step` items with a `.cx-journey-progress` line.
- On scroll, find the step nearest 45% of the viewport height. Mark it `.active`, mark earlier steps `.done`, and set the progress line height to 12%, 38%, 64% or 100% as the active index moves from first to last.
- Reference: `updateSteps()` in `site.js`.

### 4.7 ARIA tabs and filter chips
- **Tabs:** `role="tablist"` with `role="tab"` buttons and `role="tabpanel"` panels. Arrow keys move focus and selection. Each tab has `aria-controls`.
- **Filter chips:** buttons with `data-cx-filter="category"`. Clicking one shows only cards with a matching `data-category`, and updates a live count element (`aria-live="polite"`).
- Chips use `aria-pressed`.

### 4.8 Maturity slider
- A `<input type="range" min="0" max="4">`.
- Stage data is stored in a `data-cx-stages` JSON array of `{name, desc}` objects.
- On input, update the stage name and description, and animate five bar elements to heights that match the stage.

### 4.9 FAQ accordion and expandable bios
- **FAQ:** `.cx-faq-item` with a `.cx-faq-q` button and an `.cx-faq-a` answer. Only one item is open at a time. The plus icon rotates 45°.
- **Bio expand:** a button with `data-cx-bio-toggle` shows or hides a `.cx-bio` block.
- **Pillar tap-to-open:** on touch devices, tapping a `.cx-pillar` toggles its detail list. On hover and focus devices, the detail appears on hover or focus.

### 4.10 Header and navigation
- **Header:** sticky, translucent `rgba(7,19,29,.55)`, `backdrop-filter: blur(14px)`.
- **Nav links:** animated underline. Current page has `class="cx-navlink on" aria-current="page"`.
- **Services flyout:** a 400px glass dropdown that opens on hover or `:focus-within`, listing the offerings with icons.
- **Mobile:** a hamburger button (`aria-expanded`) at 980px and below. Toggles an `.open` class on the nav.
- **Note:** in the source site the header is copy-pasted into every page. In the port, the header lives in one place only, and the user must approve how it is added to existing pages (see section 0.2).

### 4.11 Contact form handler
- Validates `name` and `email` (regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Sets `aria-invalid` on bad fields and writes an error message to `.cx-form-msg`.
- On success, hides the form and shows `.cx-thanks`. A `data-cx-reset` button restores the form.
- **The source site sends nothing.** Ask the user which backend to use (Formspree, HubSpot, the existing site's form widget, or a custom endpoint). Do not invent one. Set `action` on the form and remove `preventDefault` only after the user chooses.

---

## 5. Known weaknesses of the source site (do not copy)

- Almost all styling is inline `style="..."`. Mobile rules target inline-style strings with attribute selectors such as `[style*="padding: 88px 64px"]`. Use real classes and CSS variables in the port.
- Header and footer are copy-pasted into every page. Keep the port's shared pieces in one place.
- Forms send nothing.
- No sitemap.xml, robots.txt or canonical links. Add these in the port if the user wants them, but only with approval.
- The header search button does nothing. Do not port it, or ask the user first.
- `assets/img/textures/` is unused. Do not port it.
- The OG image path is relative. Use an absolute URL.

---

## 6. Build order

1. Audit the existing site and report back (section 0.4). Wait for approval.
2. Create `cx-port.css` and `cx-port.js`. Add tokens, base components and the reduced-motion wrapper. Do not link them from existing pages yet.
3. Build the smallest template first (the audience-page section list or the FAQ block), in one new test page. Show it to the user.
4. Add features one at a time in this order: reveal, cursor spotlight, count-up, FAQ, tabs, filter, timeline, slider, background, hero signal.
5. Only after approval, wire new pages into the navigation. This is a shared-file change.

---

## 7. Acceptance checklist

- [ ] Every pre-existing file is byte-identical to before (compare against a backup or the audit snapshot).
- [ ] Every new class, id and global starts with `cx-`.
- [ ] Each new page has a unique `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:type` and `og:image`.
- [ ] Keyboard only: skip link, tabs, accordion, chips and form all work.
- [ ] Reduced motion: no animation, and the signal shows its final state.
- [ ] Layout works at 640px with no horizontal scroll.
- [ ] No console errors on load or on any interaction.
- [ ] Every placeholder is marked `[bracketed]`, so the user can find it.

---

## 8. Verification steps for the agent

- Open each new page directly from the file system (double-click), and check it still works with no server.
- Test in one desktop and one mobile-width viewport.
- Confirm every `data-cx-*` hook used in JS also appears in the HTML.
- Confirm no existing file was modified, using the checklist in section 7.

---

## 9. Questions to ask the user before starting

1. Which of the page templates in section 3 do you want?
2. Where should the new pages go in the navigation, and may you edit the shared header?
3. Keep this site's palette, or map the tokens to the existing brand colours and fonts?
4. Which form backend should the contact form use?
5. Should the hero signal visualization be included? It is complex and optional.
6. What are the real names, titles and bios, or should they stay as placeholders?
