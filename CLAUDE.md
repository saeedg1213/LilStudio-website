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
/icons/<AppName>.png    Source app icons, 1024×1024 (the wheel and app-icon.png files are made from these)
```

## Current state of the apps (updated 2026-11-14)

Saeed's rule (2026-11-14): **every app is free except LilHide ($1)**; LilClack is also $1 (his call, 2026-11-21). LilDisplay's iOS app keeps its
in-app "3 free sessions, then $2.99" unlock because that limit is in the app itself (ask before changing
that copy). Never state a price he hasn't given.

| App | Platform | How it's distributed | Price / page label | Repo |
|---|---|---|---|---|
| LilDisplay | iOS + Mac | iOS App Store id6757023864; Mac DMG `lildisplay/LilDisplay-macos.dmg` v3.3 (+ `archive/`) | 3 free sessions then $2.99 (iOS); Mac free | `~/dev/LilDisplay` (release steps in its CLAUDE.md; also mirrors to `~/dev/lildisplay-website`) |
| LilUsage | Mac | DMG `lilusage/LilUsage.dmg`, 1.1 (3) | Free · v1.1 · macOS 14.6+ | `~/dev/LilUsage` (release steps in its CLAUDE.md) |
| LilDock | Mac | DMG `lildock/LilDock.dmg`, 1.0 (1) | Free · v1.0 · macOS 14.6+ | `~/dev/LilDock` |
| LilDim | Mac | DMG `lildim/LilDim.dmg`, 1.0.0 (1) | Free · v1.0 · macOS 14.6+ | `~/dev/LilDim` |
| LilSnap | Mac | DMG `lilsnap/LilSnap.dmg`, 1.0.0 (1) | Free · v1.0 · macOS 14+ | `~/dev/LilSnap` (XcodeGen) |
| LilClack | Mac | **Coming soon** to the Mac App Store (no Apple ID yet: `APP_STORE_URL = ''`, buttons read "Coming to the Mac App Store" and point at `#try`) | **$1 once** (Saeed's price, 2026-11-21) · macOS 14+ | `~/dev/LilClack` |
| LilHide | Mac | Mac App Store id6810696786 | **$1 once** · macOS 13.5+ | `~/dev/LilHide` |
| LilMirror | Mac | Mac App Store id6811193440 | Free · macOS 13+ | `~/dev/LilMirror` |
| LilStats | Mac | Mac App Store id6821720769 | Free · macOS 14.6+ | `~/dev/LilStats` |
| LilVibe | Mac | Mac App Store id6816506472 | Free · macOS 14+ | `~/dev/LilVibe` |
| LilPad | iOS | **hidden** (not submitted); id6822490109 kept in the page | iOS 17.6+ | `~/dev/LilPad` |
| LilPass | iOS | **hidden** (not submitted); id6822983607 kept in the page | iOS 17+ | not cloned (`gh repo clone saeedg1213/LilPass`) |
| LilBounce | iOS | **hidden** (not submitted) | iOS 18+ | `~/dev/LilBounce` |

All repos are private on GitHub as `saeedg1213/<AppName>`; Apple team ID `PGZH89R37J`.

**Hidden iOS apps** (LilPad, LilPass, LilBounce, hidden 2026-11-14 because they aren't going to the
App Store yet). Their pages still exist at `/<appid>/` but carry `<meta name="robots" content="noindex">`
and are linked from nowhere. To bring one back: remove that meta from its 3 html files, re-add it to
`sitemap.xml`, drop `hidden: true` from its entry in `ALL_PRODUCTS` (`studio-wheel.js`), restore its
card from the HTML comment in `index.html` (search "hidden until they ship"), add its tile back to the
hero `.app-grid` (and go back to a 4-column grid in both `.app-grid` rules if the count needs it), update
"N right now", the meta description and the footer.

App ids are lowercase (`lildisplay`, `lildock`, `lilusage`, `lilvibe`, `lilhide`, `lilmirror`,
`lilstats`, `lilpad`, `lilpass`, `lilbounce`, `lildim`, `lilsnap`, `lilclack`). The URL is `/<appid>/`. The wheel finds the current page from the first path segment,
so the folder name must equal the wheel id.

## Visual language (neo-brutalist)

- **Fonts:** Space Grotesk (body/headings) and Space Mono (labels, badges, captions, small caps text),
  from Google Fonts with the same `<link>` on every page.
- **Borders:** `3px solid var(--border)` everywhere (`--border-width`). Hard offset shadows only,
  no blur: `box-shadow: 6px 6px 0 var(--border)` (`--shadow-offset: 6px`).
- **Hover (single buttons and cards):** lift by translating `(-2px,-2px)` to `(-4px,-4px)` with a bigger
  shadow. **Active:** press `translate(2px,2px)` with a 2px shadow. Cards sometimes sit slightly rotated
  (±0.3–1deg).
- **Hover (collections of icons or tiles: the wheel, the homepage app grid, any future icon grid):**
  the Apple Watch motion below, never a plain CSS `:hover` scale.
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
LilVibe `#FF9466` · LilHide `#6C8CFF` · LilMirror `#F7DC3C` · LilStats `#7ED48A` ·
LilPad `#FF7AC6` · LilPass `#7CC4F0` · LilBounce `#FF6B35` · LilDim `#B68CFF` · LilSnap `#3FD98A` · LilClack `#2CCBB9`.

## Motion language (Apple Watch-style)

Everything interactive should feel fluid, springy and connected, like the Watch's home screen. The
reference implementations are `studio-wheel.js` (honeycomb) and the app-grid script at the end of
`index.html` (flat tilted grid). Copy one of them rather than starting over.

Rules:
- **Follow the pointer continuously.** Targets are a smooth function of the pointer position, never a
  discrete "hovered / not hovered" swap. An element is fully swollen while the pointer is within `HOLD`
  of its centre, easing back to 1× by `REACH` (smootherstep, in units of the grid pitch: HOLD ≈ 0.25,
  REACH ≈ 0.85). Resting on an element, only it is big. Gliding to the next one, one eases down while
  the other swells.
- **Only the focused element grows.** The others keep their size and glide straight away from each
  swollen one by the radius it gained (`(m − 1) / 2 × size`), so the gap around it stays the same and
  the layout stays packed. Keep everything on screen (clamp near the viewport edges).
- **Springs, not easing curves.** Size and offset each chase their target on a damped spring:
  `v += (K·(target − x) − DAMP·v)·dt; x += v·dt` with **K = 330, DAMP = 23** (about 7% overshoot,
  settles in about 0.4 s, stable at 120, 60 and 30 fps; clamp `dt` to 1/30 s). Lower DAMP is bouncier.
- **Mind image sharpness.** Raster icons may grow only until `css size × scale × 2 ≤ image pixels`. The
  wheel's 128 px icons at 35 px stop at **1.4×**. CSS/SVG tiles can go to about 1.35–1.4× too; more
  starts to look like a different element, not a swell. Export bigger images before going larger.
- **Run only while moving.** One `requestAnimationFrame` loop starts on `pointermove` and stops when
  every spring has settled (snap the last fraction). Nothing runs while still.
- **Compute from rest positions, never from measured, animated ones**, so the effect can't feed back on
  itself. For tilted or floating containers, map the pointer into the container's own frame (see the
  grid script: inverse-rotate around the container's bounding-box centre).
- **Compose, don't fight, existing CSS.** Drive the individual `scale` and `translate` properties (or
  CSS variables on an inner element), not `transform`, when the element already has a CSS animation
  with `forwards` fill. Remove CSS `transform` transitions while JS drives the springs.
- **Who gets it:** only `(hover: hover) and (pointer: fine)`. Never with `prefers-reduced-motion`.
  Keyboard focus drives the same effect (focus = pointer on that element's centre). Touch screens get
  the plain layout.
- **Packed layouts.** Neighbours sit nearly touching at rest (the wheel's honeycomb pitch is 1.08 icons;
  the app grid's gap is 12 px on 96 px tiles). If you invent a new layout, check it numerically (pointer
  on every element and between every pair, measure overlap and the largest gap) before you look at it.
- **Test hooks**: give every new effect a `?…sweep=<a>,<b>` hook that glides a virtual pointer between
  two elements, so the hand-over can be checked where real hover isn't available (simulator, headless).

## App page anatomy (copy `lilstats/index.html` or `lilhide/index.html` as the starting point)

Sections, in order (ids are used by the nav links):

1. `<nav>`: fixed, logo (app name) · links (Studio `/`, then 2–3 `#section` anchors) · primary
   "Get It" button · theme toggle (moon/sun SVGs, `onclick="toggleTheme()"`).
2. `.hero`: `.hero-top` flex row of **app icon** | **center** (yellow `.badge` with blinking dot,
   `h1` with one `.highlight` word, `.hero-subtitle`, App Store button + `.system-req` line,
   `.privacy-notice` box linking `privacy.html`) | **visual**. Stacks vertically under ~900–1000px.
   The visual is the app's signature live element when it has one, otherwise a real screenshot:
   - **Playable demo as the hero** (LilBounce): a `<canvas>` toy in a CSS phone frame (`.play-phone`),
     with small buttons under it ("Drop them again", "Use tilt" on phones via `DeviceOrientationEvent`,
     asking permission on iOS). It behaves like the real app (same touch rules). The canvas takes every
     touch that starts on it (`touch-action: none`), so cap its height on phones (`width: min(300px, 72vw,
     36svh)` with `aspect-ratio: 3 / 5`) to leave room to scroll past.
   - **Live mock** (LilUsage meter, LilStats menu bar) or a **screenshot** otherwise.
   - Since 2026-11-14 every Mac app's hero is a MacKit desktop running a model of the app with a
     "things to try" quests panel (progress in localStorage), `?sim=` hooks and a `window.__xx` test
     handle; the iOS ones use an iPhone model. See `docs/tools/mackit/` and handoff §8.
3. `.stats-bar`: 4 cells (big Space Mono number + small caps label); yellow on hover; 2×2 on mobile.
4. Content sections (`section` → `.section-header.fade-in` with `h2` + `p`, then a grid). Usually
   Features (`.features-grid` of `.feature-card` with a coloured 48px `.feature-icon` square and an
   inline SVG), plus 1–2 app-specific sections (before/after, how it works, styles, …).
5. `.faq` (`#faq`, titled "Good to Know"): `.faq-item` cards.
6. `.contact`: card with `mailto:support@lilstudio.app` (the only support address; there is no hello@).
7. `<footer>`: `© 2026 LilStudio · Studio · a couple of sibling apps · Privacy · Support`.
8. `<script src="/studio-wheel.js?v=N" defer></script>` as the last thing (bump `v` on every page when the wheel script changes, so browsers drop the cached copy) in `<body>`.

**Head:** title `AppName – Short Benefit`, meta description, `og:*` tags (url
`https://lilstudio.app/<appid>/`, image is a screenshot or the icon), studio favicons, fonts.

**Screenshots:** prefer the owner's real device screenshots over simulator ones (LilBounce's gallery
and `og:image` lead with one). Simulator shots are fine for the rest. Keep the originals in the app
repo (`AppStore/Screenshots/`); the site gets copies scaled to 1600 px tall.

**App Store links:** use `https://apps.apple.com/app/id<AppleID>` (the Apple ID is in App Store
Connect → App Information). Mark every buy button with `data-appstore` and set the URL once in
`const APP_STORE_URL = '…'` at the top of the page script (see lildock / lilstats). Before an app
is live, leave `APP_STORE_URL = ''` and point the buttons at `#pricing` or similar. Free direct
downloads instead link a `.dmg` in the app folder with `download` (see lilusage). To ship a new
LilUsage DMG, follow the release steps in `~/dev/LilUsage/CLAUDE.md`. The DMG must contain the
notarized Developer ID build, not an Xcode debug or Apple Development build.

**Pricing section:** some pages keep one but hide it (`.pricing { display: none; }`). Don't state a
price the user hasn't given (see the table at the top). Free DMG pages show `$0` / "Free Download",
the `.pricing-card::before` ribbon says `ALWAYS FREE` (LilHide's says `ONE PRICE`). A price change touches:
nav button, hero button + `.system-req`, the quests "That's X" line, the stats-bar cell, the pricing card,
meta/og descriptions, FAQ answers, the homepage card's `.app-price`, and privacy/support wording about
purchases.

## Releasing a Mac app as a DMG (LilDock, LilDim, LilSnap, LilUsage)

Tooling is in `docs/dmg/` (not published). There is no local Developer ID certificate: signing and
notarization go through the signed-in Xcode account with `-allowProvisioningUpdates`.

1. Pull the app repo, bump `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` (both configs). LilSnap uses
   XcodeGen: it needs the git-ignored `Config/Local.xcconfig` with `DEVELOPMENT_TEAM = PGZH89R37J`, then
   `xcodegen generate` (the `.xcodeproj` is git-ignored too).
2. `docs/dmg/archive.sh <Repo> <Repo>.xcodeproj <Scheme>`: archives a universal Release build into
   `~/Library/Caches/lilstudio-dmg/<Repo>/` (`$BUILD_DIR` overrides), exports Developer ID with `ExportOptions.plist` (destination upload), then polls
   `-exportNotarizedApp` until Apple accepts it (~2–5 min). It prints `source=Notarized Developer ID` and
   `x86_64 arm64`; the notarized app is in `…/<Repo>/notarized/<Name>.app`.
3. `docs/dmg/make_dmg.sh <Name> <App.app> <icon-1024.png> "<tagline>" <hex colour> <out.dmg>`: builds the
   background with `make_bg.swift` (compiled on first use) and the DMG with `create-dmg` (Homebrew): 640×448 window, app at (170,220), Applications at (470,220).
   It refuses apps that aren't notarized Developer ID builds. Colours used: LilDock `FF6B5E`, LilDim
   `B68CFF`, LilSnap `3FD98A`, LilUsage `FFB020`.
4. Copy the DMG over `/<appid>/<Name>.dmg` (keep the file name: every button links it) and bump the
   `vX.Y` in the page's `.system-req`.
5. Move the `.xcarchive` to `~/Library/Developer/Xcode/Archives/<date>/`, `lsregister -u` and delete the
   exported `.app` copies. For LilUsage also install the app into `/Applications` (see its CLAUDE.md).
6. After pushing, confirm: `curl -sL https://lilstudio.app/<appid>/<Name>.dmg | shasum -a 256`.

App icons: LilUsage's icon (2026-11-14) is drawn by `docs/dmg/lilusage_icon.swift` in the studio icon
style (thick ink outline, flat fills, hard offset shadows, ~9% margin). Source icons for every app are in
`/icons/<AppName>.png`; regenerate `screenshots/app-icon.png` (512) and `assets/wheel/<id>.png` (128)
from them and bump `ICON_VERSION` in `studio-wheel.js`.

## Animation conventions

- Hero children fade up on load (`fadeInUp`, staggered 0.1s/0.2s/0.35s).
- Scroll reveals: add `.fade-in` (or `.scale-in`) plus `.stagger-1…4`; one `IntersectionObserver`
  adds `.visible`. Keep it.
- Each app page has one signature live animation that shows what the app does (LilUsage: a
  filling meter; LilStats: a canvas port of the menu bar renderer, a live popover, and an
  interactive 12-style gallery; LilBounce: a playable demo as the hero; homepage cards each have a
  small CSS "stage" animation).
- Pointer-driven motion follows the **Motion language** section above.
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
(nothing), what's stored locally (settings in macOS or iOS preferences), anything that touches
sensors, photos or the network and exactly how (e.g. LilBounce: motion used live and never stored;
Photos add-only for a video you choose to save), what it does NOT do, Children, Changes, Contact.
Only claim what the app really does: check its entitlements, its Info.plist usage descriptions, its
privacy manifest (`PrivacyInfo.xcprivacy`) and its code (grep for network APIs).

## Checklist: adding a new app

1. `/<appid>/index.html`, `privacy.html`, `support.html`, `screenshots/app-icon.png`
   (`sips -Z 512 icon-1024.png --out …`).
   Big screenshots: keep the original and serve a WebP (`cwebp -q 82 -alpha_q 90 -resize 1600 0 in.png -o out.webp`,
   which keeps transparency for device mockups) via `<picture>` with the PNG as the fallback. Without
   `cwebp` (not installed on every Mac; `sips` can't write WebP), use a PNG scaled with
   `sips -Z 1600 in.png --out out.png`. Give the
   `<img>` width/height and `loading="lazy"`. LilStats' "On Your Mac" section adds pulsing callout pins
   at percentage positions over the screenshot. Reuse that pattern for showing an app in context.
2. Wheel icon: `sips -Z 128 icon-1024.png --out assets/wheel/<appid>.png`. When replacing an existing
   wheel icon, bump `ICON_VERSION` in `studio-wheel.js` so browsers drop the cached image.
3. `studio-wheel.js`: add to `ALL_PRODUCTS` (`id, name, tag ≤ ~30 chars, href, color, icon`, optional
   `hidden: true` to keep an unreleased app off the wheel except on its own page). That's all:
   the wheel is drawn as an Apple Watch (case, Digital Crown, side button, straps in the current app's
   `color`, a live clock top-right on the black display) whose honeycomb slots are computed
   (`honeycomb()`: a hexagonal grid, LilStudio in the middle, ring by ring, tallest spots first), and
   `layout()` sizes the portrait display around them and parks the case up and left of the corner
   button. Hover: only the icon under the pointer grows (`MAG` 1.4×, the most the 128 px wheel images
   take while staying sharp on 2× screens); the others keep their size and slide out of its way. Check with `?wheel=open&wheelhover=<id>`.
   Auto-hide (2026-11-14, Saeed's request): once open, the watch rests Dock-style with only the top third
   of its case showing (`PEEK_FRACTION`, class `.peek`, CSS `translate` on `.lsw-watch` and `.lsw-list`).
   `pointerover` on any visible part, or the pointer at the bottom window edge below it, raises it;
   `pointerleave` sinks it after 400 ms; on touch a tap raises it and a tap elsewhere sinks it; focus
   inside raises it. The ✕ still tucks it away completely. When you change `studio-wheel.js`, bump the
   `?v=` on its `<script>` tag in every page (`grep -rl 'studio-wheel.js?v=' --include='*.html' .`).
4. Homepage `index.html`:
   - Add a colour token to `:root` under "Product accents" (`--<short>` and `--<short>-alt`;
     e.g. `--stats`), then a rule for each of `.cell.app.<short>`, `.app-stage.<short>`,
     `.app-dot.<short>`, `.btn-app.<short>`.
   - Hero `.app-grid` (4×3 since LilClack, 2026-11-21): LilStats, LilDisplay, LilDock, LilUsage /
     LilVibe, LilDim, LilSnap, LilClack / (muted), LilHide, LilMirror, (muted). The two `.cell.muted`
     slots are free for the next apps; past 12, change `grid-template-columns`/`-rows` in both `.app-grid`
     rules, desktop and ≤600px.
     It has the wheel's Watch-style hover (script at the end of index.html): the tile under the pointer
     swells on a spring and the others glide aside; it reads the column count from the computed
     `grid-template-columns` and the cells in DOM order, so keep cells (apps and muted) in grid order.
   - An `.app-card` in `.apps-grid` with a small pure-CSS stage animation in a `/* ---- AppName ---- */`
     CSS block (add it to the `prefers-reduced-motion` block too). An odd last card spans the full
     row, centred, at max 540px.
   - Update the "N right now" count, the meta description's app list, and the footer links.
5. Preview locally: `python3 -m http.server 8765` from the repo root, then open
   `http://localhost:8765/<appid>/`. Check light and dark, ~390px mobile width, and the wheel
   (`?wheel=open&wheelhover=<appid>`). Syntax-check any new script before previewing (see Testing).
6. Commit and push to `main` (that's the deploy).

## Testing hooks and tools

**Saved toolkit: `docs/tools/`** (not published). Start a server from the repo root
(`python3 -m http.server 8790`; set `PORT` if you use another), then `docs/tools/run_tests.sh [appid…]`
runs every app page's interaction test, the JS-error check on the homepage and LilDisplay, the wheel
peek test and the link check. All should print PASS / `E:0` / `0 problems`.
- `shot.py <page> <out.png> [--w 1440 --h 1000 --dark --css … --q 'sim=…' --js … --jsfile f --dom --motion --budget ms]`:
  copies the page to a temporary `_s.html` next to it with an error collector and the theme injected,
  screenshots it (or with `--dom` prints the final `document.title`, where tests write their result),
  then deletes the copy. Reduced motion is forced unless `--motion`.
- `tests/t_common.js` (helpers: `ok`, `sl`, `pe` pointer events, `$q`) + `tests/t_<appid>.js` (one per
  page; they drive the page's `window.__xx` test handle and its `?sim=` hooks). `t_wide.js` lists
  elements wider than the viewport, `t_sw.js` reports horizontal scroll, `t_peek.js` tests the wheel.
- `links.py` checks every local `href`/`src`/`#anchor` in the site. `jscheck.py file.html…` syntax-checks
  each inline `<script>` with `jsc`.
- `mackit/`: the source of MacKit (the working macOS desktop used in the app heroes: windows, menus,
  submenus, popovers, Dock, HUD, ghost pointer for "Show me" demos) and the quests panel. Each page has
  its own inlined copy (no build step), so fix a MacKit bug in every page that has it
  (`grep -l 'function MacKit' */index.html`).
- Headless gotcha: with reduced motion forced, `--dump-dom` doesn't advance CSS transitions, so
  geometry read in a `--dom` test can be mid-transition; use `--motion` or a screenshot for that.

- `?wheel=open`: force the wheel fully open (no auto-hide). By default the open watch *peeks* (Dock-style: only the top third of the case shows in the corner, `PEEK_FRACTION`) and slides up when the pointer reaches it or on a tap; `?wheel=peek` forces that start state. Apps with `hidden: true` in `ALL_PRODUCTS` (unreleased iOS apps) only appear on their own page. `?wheelhover=<id>`: simulate the pointer on one icon. `?wheelsweep=<a>,<b>`: glide a virtual pointer from icon a to b and back (4 s loop) to watch the hand-over. Homepage grid: `?gridsweep=<a>,<b>` does the same between two tiles (by class: `stats,bounce`).
- Headless Chrome screenshots work for the hero:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1440,1000 --virtual-time-budget=4000 --screenshot=out.png URL`.
  Run one instance at a time with its own `--user-data-dir`, and give it time; parallel runs
  killed early produce blank images. Hero sections are `min-height: 100vh`, so a tall window
  doesn't show the sections below it. Hash URLs (`#section`) screenshot blank, so to check a lower section,
  temporarily copy the page with `<style>.hero{display:none}</style>` injected, then delete the copy.
- **No Chrome on this Mac?** Use Safari in the iOS Simulator: `xcrun simctl openurl <udid>
  http://localhost:8765/<page>` then `xcrun simctl io <udid> screenshot out.png` (the simulator reaches the
  Mac's localhost). Real hover can't be tested there, so use the `wheelhover` / `…sweep` hooks, and take
  a few screenshots ~0.3 s apart during a sweep to see the hand-over. To see a section behind the hero
  or the wheel, serve a temporary copy with `<style>.hero-center,.lsw{display:none!important}</style>`
  injected, then delete it.
- **Syntax-check scripts** without Node: extract the `<script>` block to a file and run
  `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -e 'checkSyntax("file.js")'`.
  The same `jsc` runs quick numeric simulations (spring overshoot, packing gaps) before any visual check.
- Only stop preview servers and simulators you started yourself; other sessions may be using theirs.

## Redesigning an app page (read `docs/REDESIGN-HANDOFF.md` first)

Every app page now has a live, playable model of the app as its hero (LilDisplay on 2026-11-13, the
other eleven on 2026-11-14; §8 of the handoff lists what each one does). `/lildisplay/` was rebuilt on 2026-11-13 around a **live, playable model of the app as the
hero** (iPhone · copy · Mac, a physics cable, a working macOS desktop with the real site in
its browser, guided "things to try"). The handoff file has the full story, the code map,
the test toolkit and a playbook for the other apps.

**LilStats, LilDock, LilHide, LilVibe, LilSnap and LilDim have "big Mac" heroes (handoff §12):** the MacKit Mac
fills the first screen with a guide + glow on the next thing to click. They are generated by
`docs/tools/bigmac/bigmac.py` (re-run it after changing a page's quests or the shared hero CSS/JS).

**`/lildisplay/` is different since 2026-11-14 (handoff §11):** the whole page is one desk with a Mac
and an iPhone, no page scroll, no nav/stats/sections outside. **The website itself is the content of
the browser window on the Mac** (real HTML, `.site`, container queries; the iPhone's display shows a
cloned copy). The devices float and stay wherever they are dragged, joined by a
Verlet USB-C cable (hanging in a U) that can be yanked out and plugged back in. Edit site text inside
`.win[data-w="browser"]`; it doesn't follow the app-page anatomy below. Rules that came out of the
first rebuild:

- **Read the app's own repo first** (strings, controls, colours, current version, what is
  released). The page must behave like the real app.
- **Never push until Saeed says so**; he previews locally first. Don't commit his
  screenshots (he drops them in the app folder) or `.DS_Store`.
- Name one-off component classes so they can't collide with JS state classes
  (`.live` badge vs `section.live` broke a section). Search for every rule on a selector
  before restyling it; later rules and old media queries silently win.
- `display:` overrides `[hidden]` (add `[hidden]{display:none}`); % padding is relative to
  width; `.fade-in.visible` overrides hover transforms unless you add explicit rules.
- Interactive surfaces: preventDefault on mouse pointerdown + temporary `user-select:none`
  while dragging; invisible grab margins need `overflow-x: clip` on the section.
- A page that can load itself in an iframe must detect it (`?embed=1` or
  `window.self !== window.top`) and skip its simulator.
- Testing: headless Chrome is ≥ 500 px wide; continuous rAF loops stall its virtual time
  (screenshot with `--force-prefers-reduced-motion`); very tall screenshots glitch, so
  screenshot sections in isolation. Interaction tests = a temporary `_t.html` copy with
  an injected script dispatching PointerEvents and writing PASS/FAIL to `document.title`.
- `docs/` is excluded from the published site (`_config.yml`); other `.md` files
  (including this one) are public.

## LilClack page notes (2026-11-21)

- Built from `lilstats/index.html` (base CSS, MacKit CSS/JS, Quests) plus LilClack-specific CSS/HTML/JS.
  The hero model plays the app's **real recordings** with Web Audio: `lilclack/sounds/<board>.flac` sprites
  + `sprites.json` (start/duration of every take), made by `~/dev/LilClack/scripts/web-sprites.py <site>/lilclack/sounds`
  whenever the app's packs change. FLAC decodes in Safari, Chrome and Firefox; decoding uses an
  OfflineAudioContext so nothing plays (or warns) before a click.
- The JS ports the app's logic 1:1: `Dynamics.swift` (rhythm → intensity), `Variation.swift` (layer and
  per-key take), `KeyMap.swift` (KeyboardEvent.code → Mac key code, pan, class), `Router.swift` (what to play).
  Typing only sounds in the note window and the "Type here" field; ⌃⌥K toggles anywhere on the page.
- Hooks: `?sim=pop,options,call,crisp,off`; `window.__lc`; test `docs/tools/tests/t_lilclack.js`.
- When it goes live: set `APP_STORE_URL` (the buttons then read "Mac App Store"), change the badge
  "Coming Soon · Mac App Store", the homepage card's `.app-price` and the FAQ "on its way" line.
