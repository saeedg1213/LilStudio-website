# LilStudio website — notes for adding an app

Static site for **lilstudio.app** (GitHub Pages; `CNAME` at the root). No build step, no framework,
no npm: every page is a hand-written `.html` file with its CSS in a `<style>` block and its JS in a
`<script>` block. Pushing to `main` deploys, so pushing is publishing.

## Layout

```
/index.html            Studio homepage (hero app grid, app cards, footer)
/studio-wheel.js       Product switcher in the bottom-right corner of EVERY page
/assets/subpage.css    Shared style for privacy/support pages
/assets/theme.js       Light/dark theme (load in <head>, no defer)
/assets/wheel/<id>.png Wheel icons, 128×128 (full app icon scaled down; CSS crops it round)
/favicon/              Studio favicons (app pages use these unless they ship their own)
/<appid>/index.html    App page (e.g. /lilstats/)
/<appid>/privacy.html  Privacy policy (built on subpage.css)
/<appid>/support.html  Support page (built on subpage.css)
/<appid>/screenshots/  app-icon.png (512 or 1024) + real screenshots
```

App ids are lowercase (`lildisplay`, `lildock`, `lilusage`, `lilvibe`, `lilhide`, `lilmirror`,
`lilstats`). The URL is `/<appid>/`. The wheel finds the current page from the first path segment,
so the folder name must equal the wheel id.

## Visual language (neo-brutalist)

- **Fonts:** Space Grotesk (body/headings) and Space Mono (labels, badges, captions, small caps text),
  from Google Fonts with the same `<link>` on every page.
- **Borders:** `3px solid var(--border)` everywhere (`--border-width`). Hard offset shadows only,
  no blur: `box-shadow: 6px 6px 0 var(--border)` (`--shadow-offset: 6px`).
- **Hover:** lift by translating `(-2px,-2px)` to `(-4px,-4px)` with a bigger shadow. **Active:** press
  `translate(2px,2px)` with a 2px shadow. Cards sometimes sit slightly rotated (±0.3–1deg).
- **Theme tokens** (define on `:root`, override under `[data-theme="light"]`):
  - Dark: `--bg #0D0D0D`, `--bg-elevated #1A1A1A`, `--text #FFF`, `--text-muted ~#888–#A8A8A8`, `--border #FFF`
  - Light: `--bg #F7F1DE`, `--bg-elevated #F7F1DE or #FFFBEF`, `--text #17150F`, `--text-muted #55503F`, `--border #17150F`
  - The default theme is **light**. The choice is stored in `localStorage.theme` and shared site-wide.
- **Per-app colours:** each app has `--primary` (its brand colour, taken from the app icon) and
  `--secondary`. `--yellow: #FFE135` is the shared badge colour. Text on a coloured fill is always
  black (`#000` / `#17150F`) in both themes.
- **Signature details:** the logo underline is an 8px bar of `--primary` behind the wordmark;
  section `h2` titles have a 12px skewed highlight behind them; the hero `.highlight` word gets a
  35%-height primary bar; there's a faint 80px grid `.bg-pattern` behind everything.

Colours already used in the wheel (pick something distinct for a new app):
studio `#FFE135` · LilDisplay `#00FF88` · LilDock `#FF6B5E` · LilUsage `#FFB020` ·
LilVibe `#FF9466` · LilHide `#6C8CFF` · LilMirror `#F7DC3C` · LilStats `#7ED48A`.

## App page anatomy (copy `lilstats/index.html` or `lilhide/index.html` as the starting point)

Sections, in order (ids are used by the nav links):

1. `<nav>`: fixed, logo (app name) · links (Studio `/`, then 2–3 `#section` anchors) · primary
   "Get It" button · theme toggle (moon/sun SVGs, `onclick="toggleTheme()"`).
2. `.hero`: `.hero-top` flex row of **app icon** | **center** (yellow `.badge` with blinking dot,
   `h1` with one `.highlight` word, `.hero-subtitle`, App Store button + `.system-req` line,
   `.privacy-notice` box linking `privacy.html`) | **visual** (screenshot or a live mock). Stacks
   vertically under ~900–1000px.
3. `.stats-bar`: 4 cells (big Space Mono number + small caps label); yellow on hover; 2×2 on mobile.
4. Content sections (`section` → `.section-header.fade-in` with `h2` + `p`, then a grid). Usually
   Features (`.features-grid` of `.feature-card` with a coloured 48px `.feature-icon` square and an
   inline SVG), plus 1–2 app-specific sections (before/after, how it works, styles, …).
5. `.faq` (`#faq`, titled "Good to Know"): `.faq-item` cards.
6. `.contact`: card with `mailto:support@lilstudio.app` (the only support address; there is no hello@).
7. `<footer>`: `© 2026 LilStudio · Studio · a couple of sibling apps · Privacy · Support`.
8. `<script src="/studio-wheel.js" defer></script>` as the last thing in `<body>`.

**Head:** title `AppName – Short Benefit`, meta description, `og:*` tags (url
`https://lilstudio.app/<appid>/`, image is a screenshot or the icon), studio favicons, fonts.

**App Store links:** use `https://apps.apple.com/app/id<AppleID>` (the Apple ID is in App Store
Connect → App Information). Mark every buy button with `data-appstore` and set the URL once in
`const APP_STORE_URL = '…'` at the top of the page script (see lildock / lilstats). Before an app
is live, leave `APP_STORE_URL = ''` and point the buttons at `#pricing` or similar. Free direct
downloads instead link a `.dmg` in the app folder with `download` (see lilusage).

**Pricing section:** some pages keep one but hide it (`.pricing { display: none; }`). Don't state a
price the user hasn't given.

## Animation conventions

- Hero children fade up on load (`fadeInUp`, staggered 0.1s/0.2s/0.35s).
- Scroll reveals: add `.fade-in` (or `.scale-in`) plus `.stagger-1…4`; one `IntersectionObserver`
  adds `.visible`. Keep it.
- Each app page has one signature live animation that shows what the app does (LilUsage: a
  filling meter; LilStats: a canvas port of the menu bar renderer, a live popover, and an
  interactive 12-style gallery; homepage cards each have a small CSS "stage" animation).
- Respect `prefers-reduced-motion` (kill animations/transitions; show final states).
- Keep pages light: pause JS loops when `document.hidden`, skip drawing offscreen canvases,
  and handle HiDPI with `devicePixelRatio`.
- Theme switches must re-read colours: canvases read `--text` via `getComputedStyle` and listen with
  a `MutationObserver` on `data-theme`.

## Privacy & support pages

Both use `/assets/subpage.css` + `/assets/theme.js` and set colours in a tiny block:
```html
<style>:root { --primary: #…; --secondary: #…; }</style>   <!-- optional: --logo-bar -->
```
Structure: `.sp-nav` (logo → `./`, links Studio / App / Support / Privacy, with
`aria-current="page"` on the current one, `sp-hide-sm` on Studio and Privacy), then `<main class="sp">`
with `h1`, a `.updated` (privacy) or `.lede` (support) line, a `.note` callout, `h2`/`h3`/`p`/`ul`,
and a footer "X is part of LilStudio". Privacy pages follow one template: what's collected
(nothing), what's stored locally (settings in macOS preferences), what it does NOT do, Children,
Changes, Contact. Only claim what the app really does: check its entitlements and code.

## Checklist: adding a new app

1. `/<appid>/index.html`, `privacy.html`, `support.html`, `screenshots/app-icon.png`
   (`sips -Z 512 icon-1024.png --out …`).
   Big screenshots: keep the original and serve a WebP (`cwebp -q 82 -alpha_q 90 -resize 1600 0 in.png -o out.webp`,
   which keeps transparency for device mockups) via `<picture>` with the PNG as the fallback. Give the
   `<img>` width/height and `loading="lazy"`. LilStats' "On Your Mac" section adds pulsing callout pins
   at percentage positions over the screenshot. Reuse that pattern for showing an app in context.
2. Wheel icon: `sips -Z 128 icon-1024.png --out assets/wheel/<appid>.png`.
3. `studio-wheel.js`: add to `PRODUCTS` (`id, name, tag ≤ ~30 chars, href, color, icon`) **and**
   give it a slot in `LAYOUT`. Slots: inner ring `r: 2.2` (studio 225°, lildisplay 195°, lildock 255°);
   outer ring `r: 3.35`, currently 5 icons 21° apart (183, 204, 225, 246, 267). Neighbours need
   ≥ ~1.15 tile widths between centres (chord = 2·r·sin(Δa/2)), so the outer ring is full at 5.
   A ninth app means re-spacing the rings (e.g. a third ring around r ≈ 4.5 and bumping `OUTER_R`,
   which sizes the dial) and checking it with `?wheel=open&wheelhover=<id>`.
4. Homepage `index.html`:
   - Add a colour token to `:root` under "Product accents" (`--<short>` and `--<short>-alt`;
     e.g. `--stats`), then a rule for each of `.cell.app.<short>`, `.app-stage.<short>`,
     `.app-dot.<short>`, `.btn-app.<short>`.
   - Hero `.app-grid` (3×3): currently LilStats, LilDisplay, *muted* / LilDock, LilUsage, LilVibe /
     LilHide, LilMirror, *next*. One empty `muted` cell is left; after that the grid needs a new layout.
   - An `.app-card` in `.apps-grid` with a small pure-CSS stage animation in a `/* ---- AppName ---- */`
     CSS block (add it to the `prefers-reduced-motion` block too). An odd last card spans the full
     row, centred, at max 540px.
   - Update the "N right now" count, the meta description's app list, and the footer links.
5. Preview locally: `python3 -m http.server 8765` from the repo root, then open
   `http://localhost:8765/<appid>/`. Check light and dark, ~390px mobile width, and the wheel.
6. Commit and push to `main` (that's the deploy).

## Testing hooks

- `?wheel=open`: force the wheel open. `?wheelhover=<id>`: simulate hovering one icon.
  `?wheelsim=<frames>[&wheelnear=1]`: step the drift physics (headless browsers have no rAF).
- Headless Chrome screenshots work for the hero:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1440,1000 --virtual-time-budget=4000 --screenshot=out.png URL`.
  Run one instance at a time with its own `--user-data-dir`, and give it time; parallel runs
  killed early produce blank images. Hero sections are `min-height: 100vh`, so a tall window
  doesn't show the sections below it. Hash URLs (`#section`) screenshot blank, so to check a lower section,
  temporarily copy the page with `<style>.hero{display:none}</style>` injected, then delete the copy.
