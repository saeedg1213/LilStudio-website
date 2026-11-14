# LilStudio website redesign — handoff (started with LilDisplay, 2026-11-13)

This folder is excluded from the published site (`_config.yml` → `exclude: docs`).
Read the root `CLAUDE.md` first; this file is the long version: what was built on
`/lildisplay/`, how it works, every trap we hit, what Saeed liked, and how to do the
same for the other apps.

---

## 1. What was done on LilDisplay (commit `d9d19ab`, live)

Files: `lildisplay/index.html` (rewritten, ~4,500 lines, all CSS + JS inline),
`lildisplay/support.html` (3.3 updates), new `lildisplay/screenshots/app-icon.png`
(512 px from the app's AppIcon) and `IMG1/IMG2/IMG3/IMGiPad1.webp` (1600 px copies).

Page order now: **hero (live model) → stats bar → What's New in 3.3 → First-Time Setup
(tabbed) → Three Ways to Use It → Features (12 cards) → Gestures (12 animated cards) →
On Real Desks (2×2 gallery) → Pricing → FAQ ("Good to Know") → Contact → footer.**
The Compare section was removed (Saeed's call); the FAQ links the `vs-*` guide pages instead.

### The hero is the product
Three columns on wide screens: **iPhone · copy · Mac**, joined by a cable.
- **Copy (middle):** badge, h1 with `.highlight`, subtitle, the two download buttons
  **stacked** (iOS above Mac, with a 2.9rem gap the cable runs through), privacy box,
  and a "LIVE — these devices work…" line telling people to interact.
- **Mac (right, 50% of the width):** a real-feeling macOS desktop (details below).
- **iPhone (left):** the real 3.3 iOS app UI (details below).
- **Cable:** a Verlet rope (gravity, inertia, fixed length). At the default layout it's
  guided through the gap between the two download buttons in a gentle S-bend; once a
  device is moved it hangs free and swings. Still when disconnected; when connected it
  ripples, its dashes flow (direction = data direction) and yellow/blue packets ride it.
  When a window crosses screens a green "lump" with a tiny window icon travels down it.
- **Devices are draggable** by a 40 px invisible margin, their bezels, or a visible
  "⠿ drag to move" grip pill under each. "↺ Reset layout" appears after moving.
- Under 1060 px: copy on top, devices in a row (≥ 700 px) or stacked (phones).

### The Mac (world = 1024×640 points, scaled to fit)
Menu bar (Apple, app, File, Edit, View, Window, Help menus — sliding along the bar
switches menus like macOS; Spotlight ⌕; LilDisplay status item "LilDisplay · Code NN"
with the **real 3.3 menu**: status, FPS, Pairing Code + QR submenu, Display Quality
(changes the iPhone picture), Reconnect, Permissions, Fix Permissions, Advanced (Keep
Awake When Lid Is Closed, Show CPU & Memory, New Pairing Code), Launch at Login,
Help & Support…, Quit). Dock with running dots. Windows: Notes (typing target),
**Browser showing the real site** (an iframe of `/lildisplay/?embed=1`; same-site links
browse inside it, address bar + ‹ › history work, external links open a new tab),
**Terminal** (looping coding session: swift build with progress bar → tests → commit →
push), Music (Space 2), Photos (Space 2), Finder (closed by default). Every window:
red closes, yellow genie-minimizes to the Dock, green zooms (also double-click the
title bar), resize corner, drag by title bar — including onto the iPhone. About This
Mac (lists the iPhone as a 2nd display when connected), Sleep, Restart (boot bar),
Spaces with slide animation, Mission Control, Show Desktop, Launchpad (shows the
LilStudio app icons from `/assets/wheel/`), Look Up popover, right-click menu, zoom.
Lid can close (with Keep Awake the windows all move onto the iPhone; without it the
Mac sleeps and the iPhone disconnects).

### The iPhone (world = 360×780 points; landscape 780×360)
Mirrors the iOS 3.3 app (read from `~/dev/LilDisplay/Reciever/Reciever/Components.swift`
and `ControlPanel.swift`): idle screen (logo + "Swipe up to connect"), bottom-sheet menu
with segmented toggles styled like the app (light: yellow/green pills with ink borders;
dark: blue/indigo/green), **two digit wheels for the WiFi code (1–9, 0–9, wrap) + Scan
button at the right edge**, Portrait | Landscape (FLIP rotation around the phone's own
centre), Display | Remote | Trackpad, Connect (pulses until first connection). In
landscape the menu docks to the right half and the logo sits centred on the left.
Display/Remote = the phone is a 2nd display left of the Mac (macOS arrangement);
Trackpad = full-screen pad (relative pointer, real multi-touch on phones: 2-finger
scroll/pinch/flick/twist, 3-finger swipes/tap, 4-finger spread/pinch), keyboard sheet.
WiFi needs the right code; Scan + hovering Pairing Code on the Mac pairs (QR is
decorative, not a real code). "Pair once": the code is remembered in localStorage.

### Teaching layers
- On connect, the leftmost Mac window slides to straddle the edge (half on each screen).
- Coach mark: a dashed ghost of that window + hand glides toward the iPhone under a
  yellow "← Drag me onto your iPhone" label, until someone has dragged a window across.
- Drop zone "Drop here" pulses on the iPhone while dragging.
- "Seven things to try" quest cards under the hero, each with "▶ Show me" autopilot,
  progress bar, saved in localStorage, final CTA when all 7 are done.
- Gesture chips under the devices (in Remote/Trackpad) and the 12 gesture cards lower on
  the page both play the gesture in the model (finger dots animate, then the effect).

### Other fixes made along the way
Theme set in `<head>` via `/assets/theme.js` (no flash); setup text/screenshots updated
to 3.3 (old "Streaming Quality" / CPU-row screenshots dropped); all `<img>` have
width/height + `loading="lazy"`; `APP_STORE_URL` + `data-appstore`; FAQ JSON-LD updated
(Trackpad mode, pair once); pricing lists Trackpad mode; support page: QR pairing,
pair once, the three modes, "Trackpad mode needs Mac 3.3".

---

## 2. How the code is organised (`lildisplay/index.html`, bottom `<script>`)
In order: scroll reveals → pseudo-QR → GESTURES table + gesture cards → setup tabs →
**simulator** (`S` state object, `WINS` windows, `TERM_SCRIPT` terminal, iframe embed
helpers, `layout()` geometry, `ROPE` cable physics, windows/content render, cursor,
pointer handling (direct + relative/multi-touch recogniser), Mac menus/Spotlight/
Finder, connection/lid/scanner, gestures `perform()`, quests + "Show me", `render()`).
Key ideas worth copying:
- **One world, two copies:** each window is rendered twice (Mac layer + iPhone layer)
  from the same world coordinates; each layer is `transform: scale()`d to its screen.
  The iPhone layer is translated by `PO` (phone origin, left of the Mac).
- **Never measure animated things:** layout from state, FLIP only for the rotation.
- **Loops only when needed:** rope rAF stops when settled + disconnected; terminal
  `setTimeout` pauses when hidden/offscreen/minimized; IntersectionObserver gates both.
- **Test hooks:** `?sim=connect|remote|trackpad|wifi|lid|mc|lp|drag|qr|menu|landscape|landidle|filemenu`.

---

## 3. Traps we hit (check these first on every page)
1. **Class-name collisions with state classes.** A badge styled `.live` broke the whole
   Gestures section because JS also adds `live` to sections while on screen. Prefix
   one-off component classes (`.live-tag`), and grep before naming.
2. **Ever-growing z-index** (windows `z = ++S.z`) eventually covered the menus. Put such
   stacks in their own context (`isolation: isolate`) under the UI layer.
3. **Later CSS rules silently win**: `.phone { z-index: 6 }` was overridden by the
   original `.phone {… z-index: 3}` further down; a mobile media query kept the old
   boxed `.desk` shadow. When restyling, search for every rule on that selector.
4. **`display:` beats `[hidden]`**: `.chip { display: inline-flex }` showed a hidden
   button → add `.chip[hidden] { display: none; }`.
5. **% padding/margins are relative to the width** (a `padding-top: 22%` logo sat far
   too high on a 360-wide screen). Use px/em for vertical spacing.
6. **`.fade-in.visible { transform: none }` overrides hover lifts and card rotations**
   (same specificity, later rule). Add explicit `.card.fade-in.visible:hover` rules.
7. **Dragging across text selects it** → `preventDefault()` on mouse pointerdown in
   interactive surfaces + a temporary `user-select: none` class on `<html>`.
8. **Invisible grab margins cause horizontal scroll on phones** → `overflow-x: clip`
   on the hero (not `hidden`, which makes a scroll container).
9. **Fake cursor vs iframe:** pointer events inside an iframe don't reach the parent.
   Inject `cursor: none` into the frame's document and forward its `pointermove`.
10. **Page inside its own iframe = infinite nesting.** Guard in `<head>`:
    `if (?embed=1 || window.self !== window.top) html.classList.add('embed')` and
    return before building the simulator. Rewrite in-frame links to `?embed=1`.
11. **SVG `animateMotion` elements sit at (0,0) before their `begin`** → start
    `visibility="hidden"` and `<set>` it visible at `begin`.
12. **Rope realism:** pinned guide points need the whole guided stretch pinned (else it
    sags ~45 px behind a button). Keep rope length when unpinning so it swings.
13. **Rotation:** to keep a device's centre, lay out the new orientation, then FLIP
    (translate+rotate±90°+scale from the old box to the new one).

## 4. Testing toolkit that worked
- Preview: `python3 -m http.server 8777` from the repo root (8765 may be another
  session's). Screenshots: headless Chrome, **one user-data-dir per run**.
- Headless Chrome **minimum width is 500 px**; a 390 px iframe wrapper works for normal
  pages but triggers the embed guard on LilDisplay → measure at 500 instead.
- **Continuous rAF loops stall headless virtual time** (elements stay mid-fade) → take
  screenshots with `--force-prefers-reduced-motion` (the page then skips loops).
- **Very tall full-page screenshots (~10k px) render garbage**; screenshot sections
  in isolation by injecting `<style>section:not(#id){display:none!important}</style>`
  into a temporary copy (`_s.html`), then delete it.
- **Automated interaction tests:** inject a `<script>` into a temporary copy
  (`_t.html`) that dispatches real `PointerEvent`s / `KeyboardEvent`s, checks DOM
  state, writes PASS/FAIL into `document.title`; run with `--dump-dom` and grep the
  title. Delete the copy after. (Scripts used: connect, drag window across, Mac menu,
  panel, trackpad + 3-finger swipe, Mission Control, typing, pad cursor, WiFi wrong
  code, QR scan, lid; window buttons, menus, Spotlight, resize; device drag handles.)
- Syntax: extract the last `<script>` and run JavaScriptCore `checkSyntax`.
- Link check (Python, all `*.html`, local `href/src/srcset` + in-page `#anchors`):
  everything resolved except the known missing `lilvibe/screenshots/{menu,settings,desktop}.png`.
- Before pushing: `curl` the live URL with `?n=$RANDOM` and grep for a new id.

## 5. What Saeed wants (from this session)
- **Think big, make it addictive and interactive**, but every detail must match the real
  app (read the app's source for exact strings, controls, colours, behaviour).
- **Never push until he says so.** He previews at the local server first. When he says
  "commit and push", run the full checks (links, tests, phone width) first.
- Iterates fast with screenshots (he saves them into the app folder — **don't commit
  them**; also don't commit `.DS_Store`).
- Liked: a live model as the hero; the iPhone + text + Mac layout; physical, swinging
  cable; things that move only when they mean something (cable still until connected);
  real website inside the Mac; Terminal with a coding session; drag handles; quests.
- Disliked/asked to fix: tiny landscape phone, things covering text or each other,
  menus under windows, lost pointer, text selection while dragging, labels he didn't
  need (removed the cable status label and the dashed outline), off-centre sections.
- Keep the LilStudio look (neo-brutalist, Space Grotesk/Mono, 3px borders, hard shadows,
  light default) and the voice ("we", no "one-person shop").

## 6. Playbook for the other app pages
For each app (`lildock, lilusage, lilvibe, lilhide, lilmirror, lilstats, lilpad,
lilpass, lilbounce, lildim, lilsnap`):
1. **Read the app first**: find its repo in `~/dev/` (seen: `LilHide`, `LilPad`,
   `LilStats`, `LilUsage`, `LilBounce`, `LilDisplay`, …; ask Saeed where the others
   live), its `CLAUDE.md`/notes/`WHATS_NEW`, UI strings, menus, settings, current
   version, privacy facts. Note what's released vs not.
2. **Audit the current page**: outdated text/screenshots, formatting, broken links,
   theme flash, missing sizes/lazy, mobile overflow, alignment.
3. **Design one signature live hero** that *is* the app working (the LilDisplay
   pattern: device(s) + copy, interactive, with a "LIVE — try it" line and guided
   "things to try"). Ideas to propose (check with Saeed before building):
   - LilStats — a working menu bar with its live graphs, the popover, style gallery.
   - LilDock — a Mac Dock you can configure live (what the app changes).
   - LilUsage — the meter filling from a simulated session; plan switcher.
   - LilHide — a menu bar crowded with icons you can hide/reveal like the app.
   - LilMirror — a webcam-mirror window (gradient placeholder, no real camera unless
     asked) with the app's controls.
   - LilVibe / LilDim / LilSnap / LilPass / LilPad — read the app, then pick its one
     magic moment and make it playable.
   - LilBounce already has a playable canvas hero; polish rather than replace.
4. Reuse: the macOS desktop/menu-bar/window code and styles from `lildisplay/index.html`
   (copy, don't share a file — the site has no build step), the testing toolkit above,
   test hooks `?sim=…`, reduced-motion behaviour, pause-when-hidden loops.
5. Keep page anatomy from `CLAUDE.md` (nav, stats bar, features, FAQ "Good to Know",
   contact, footer, wheel script last). Update the homepage card/meta only if needed.
6. Verify (section screenshots light + dark, 500 px and 1440 px, automated tests,
   link check), show Saeed locally, push only when he says.

## 7. Open items (LilDisplay)
- **iOS 3.3 is not in the App Store yet**, but the page presents 3.3 features. Release it
  (see `~/dev/LilDisplay/CLAUDE.md` handoff). Mac 3.3 DMG is already live.
- After 3.3 ships: roadmap G0 (retire `lilstudio.app/lilpad/` → point to LilDisplay).
- `lildisplay.app` mirror repo (`~/dev/lildisplay-website`) only needs DMGs; it redirects.
- The automated test scripts are now saved in `docs/tools/` (see §10).

## 8. Second pass: every other app page (2026-11-14, live since commit `60ebc84`)
Each page now opens with a live model of the app plus "things to try" quests (▶ Show me
autopilot with a ghost pointer). Mac apps share a **MacKit** block (CSS `.mk-*`, JS
`MacKit()` + `Quests()`), copied into each page (no build step). It gives a scaled macOS
desktop (1024×640 points, 760×475 under 620 px), draggable windows with working traffic
lights, menu-bar menus that slide like macOS (submenus flip and slide up to fit),
popovers, a Dock, HUD, and `M.press(el)` for demos.
- **LilStats**: menu bar runs the real renderer port; popover; full Settings (12 styles,
  colour, labels, reorder, interval); workloads (Terminal build → P-cores, video export →
  GPU, Safari tabs → RAM); Sleep pauses sampling; style gallery drives the model.
- **LilHide**: desktop of icons (draggable, kept in place), left-click hides, right-click
  menu (2.0: Background submenu with gradients/colors/+ My Image), ⌃⌥⌘H works on the page,
  double-click to reveal, Hide at Launch, screen-share scenario. Old menu/prompt screenshots
  (removed UI) replaced with CSS illustrations; compare shots now WebP.
- **LilUsage**: first-run intro → Keychain prompt (Allow vs Always Allow), Claude Code in
  Terminal fills the meter, ••• menu, ⏩ time skip to reset, log out → "Sign in" → /login.
  Added `screenshots/app-icon.png` and `support.html`.
- **LilDock**: strip in the menu bar with the app's magnification math, Downloads stack,
  Settings matching the real window (sliders, + Add, drag to reorder, Copy & Open Terminal
  → ⌘V/Return hides the Dock), full-height zoom. Old Try It section removed.
- **LilSnap**: real ⌃⌥ shortcuts (arrows, chords, 1–5, C, ↩, ⌫, ⌘2–4), drag to edges with
  preview, Snap Bar, menu tile grid, cheat sheet, gaps.
- **LilDim**: dim/blur layer right behind the front window (crossfades), real popover,
  tabbed Settings (Look matches the screenshot), App highlight, pause + Keynote rule, peek,
  Light/Dark profiles follow the site theme.
- **LilMirror**: illustrated mirror (eyes follow the pointer), green camera light, menu,
  iPhone camera, optional real webcam (opt-in, only while open). Added `support.html`.
- **LilVibe**: the real scene videos and sound files as the wallpaper; menu with scenes,
  volume, Video off, Match Wallpaper; full-screen window pauses it. Old Try It removed;
  How It Works images pointed at missing files → now the scene stills.
- **LilPass** (iPhone): the real list/card screens (EAN-13 and Code 39 drawn properly),
  swipe, enlarge, favorites, 5-card paywall, and a checkout scanner you drag the phone onto
  (beep) along a 5-stop day.
- **LilPad** (iPhone): connect → sign in → pad; the pad drives the Mac pointer (tap,
  drag, 2-finger scroll/right-click/pinch, 3-finger Mission Control/Spaces/Look Up, 4-finger
  desktop), settings sheet, lock with hold-to-unlock. Gesture buttons for mouse users.
- **LilBounce**: demo updated to v1.0 behaviour: seven ball types in a mix, the island is a
  wall and a hungry dog's mouth (eats a held ball pushed into it), Shake, quests.
- Also: theme.js in `<head>` everywhere (was missing on several pages and the homepage),
  logo links, `data-appstore` buttons, image sizes, system requirements from the repos
  (LilHide 13.5+, LilUsage 14.6+, LilPad 17.6+), footers unified, link check clean.
- **Built without reading the app repo** (they weren't cloned at the time): LilDock, LilVibe,
  LilMirror, LilPass, LilDim were modelled from the page copy and real screenshots. All are now on
  GitHub (`saeedg1213/<App>`) and, except LilPass, cloned in `~/dev`: a worthwhile follow-up is to
  check those models' menus, strings and settings against the source.
- Tests: each page has `?sim=` hooks and `window.__xx` handles; the scripts are in
  `docs/tools/tests/` and all pass (§10).

## 9. Mac DMGs, free pricing, hidden iOS pages (2026-11-14, live since commit `60ebc84`)

- **DMGs** on the site: `lildock/LilDock.dmg` (1.0 (1)), `lildim/LilDim.dmg` (1.0.0 (1)), `lilsnap/LilSnap.dmg`
  (1.0.0 (1)), and `lilusage/LilUsage.dmg` (same notarized 1.1 (2) app, new background). Each was archived
  from `main` (universal), Developer ID exported via `-allowProvisioningUpdates`, notarized and stapled.
  Archives are in `~/Library/Developer/Xcode/Archives/2026-11-14/`. LilSnap needs the git-ignored
  `Config/Local.xcconfig` (`DEVELOPMENT_TEAM = PGZH89R37J`) and `xcodegen generate`.
- **Tooling** in `docs/dmg/`: `archive.sh <repo> <proj> <scheme>` (archive, upload, poll notarization),
  `make_dmg.sh <Name> <App.app> <icon.png> <tagline> <hex> <out.dmg>` (create-dmg, 640×448 window, icons at
  170/470 × 220), `make_bg.swift` (studio-style background: cream grid, icon + name with primary bar,
  bordered drop cards, yellow arrow and badge), `lilusage_icon.swift` (the new LilUsage icon).
- **Prices:** every app is free except LilHide ($1). LilDock/LilDim/LilSnap pages are now "Download for Mac"
  (DMG, `download` attribute) with "Free · v1.0 · macOS X+"; LilMirror/LilVibe/LilStats say Free on the Mac
  App Store. LilDisplay still shows its 3-sessions-then-$2.99 iOS unlock (that's in the app itself).
- **Hidden iOS apps** (LilBounce, LilPad, LilPass): pages kept but `noindex`, removed from the sitemap,
  the homepage (hero grid is now 3×3, `COLS` read from CSS; cards commented out in index.html), the footer,
  LilDisplay's Launchpad, and the wheel (`hidden: true` in `ALL_PRODUCTS`, still shown on its own page).
- **LilUsage icon:** new 1024 icon in the studio style (`icons/LilUsage.png`, wheel, app-icon.png).
  Shipped in LilUsage 1.1 (3) (repo pushed, DMG live, installed in `/Applications`). The LilDisplay wheel
  icon was also refreshed from the app's real icon; `ICON_VERSION` is 6. Every site icon was checked
  against its repo's 1024 icon and matches.
- **Wheel auto-hide** (commit `7d56809`): Dock-style peek, see `CLAUDE.md` › Checklist step 3.
  The first version only reacted in a thin zone over the case, so hovering the visible strap did
  nothing; it now listens for `pointerover` on the watch itself. Pages load `studio-wheel.js?v=2`.

## 10. Where everything stands (end of 2026-11-14 session)

**Live on lilstudio.app** (`main` = `origin/main`): all of §8 and §9.

**Tooling saved in the repo** (all under `docs/`, which is not published):
- `docs/tools/` — `run_tests.sh` (runs everything), `shot.py`, `links.py`, `jscheck.py`,
  `tests/t_common.js` + `tests/t_<appid>.js`, `tests/t_peek.js`, `t_wide.js`, `t_sw.js`, and
  `mackit/` (MacKit + Quests source). Usage is in `CLAUDE.md` › Testing hooks and tools.
- `docs/dmg/` — archive/notarize/DMG scripts and the icon generator (`CLAUDE.md` › Releasing a
  Mac app as a DMG). Builds land in `~/Library/Caches/lilstudio-dmg/`.

**Local state outside the repo:**
- Archives: `~/Library/Developer/Xcode/Archives/2026-11-14/` (LilDock, LilDim, LilSnap, LilUsage).
- `~/dev/LilSnap/Config/Local.xcconfig` holds the team ID (git-ignored, needed to build).
- Saeed's two `lildisplay/Screenshot 2026-11-13 …png` files and the `.DS_Store` files are
  deliberately uncommitted.

**Open items / ideas (none started):**
1. Check the LilDock, LilDim, LilVibe, LilMirror and LilPass page models against their source (§8).
2. LilDisplay iOS 3.3 release, then retire `/lilpad/` in favour of LilDisplay (§7).
3. When an iOS app ships: un-hide it (`CLAUDE.md` › Current state › Hidden iOS apps).
4. The LilDock, LilDim and LilSnap support pages still describe how the apps behave under the App Store
   sandbox (they are still sandboxed builds, so the wording is accurate); revisit if a direct-download
   build drops the sandbox.


## 11. LilDisplay rebuilt again: the site lives on the Mac (2026-11-14, local, not pushed)

Saeed asked for the website "shown only in the Mac", the Mac wired to the iPhone with a USB cable "with
the physics that makes sense", both devices movable, simpler and less detailed than §1, and playful.
`lildisplay/index.html` was rewritten (~2,200 lines, was ~4,500). The old version is in git (`9c10af3`).

**What the page is now**
- One screen (`.room`, `position: fixed`, no page scroll): a desk band at the bottom, a MacBook on it,
  an iPhone clipped to the left side of the lid (phones: landscape, resting on top of the lid), a
  USB-C cable from the iPhone's port to the Mac's base. The studio wheel is still loaded last.
- **The website is inside the Mac**: a browser window (`.win[data-w="browser"]`) whose body is the
  whole site (nav with theme toggle, hero + downloads, stats, modes, what's new, features, gestures,
  photos, setup, pricing, FAQ, contact form, footer). Same text, JSON-LD and meta as before, with
  section `id`s so `#faq` links work. In-site `#` links scroll the window (`scrollSiteTo`).
  Responsive by container queries on `.b-scroll`.
- The Mac world is ~880 points wide (`sm = clamp(screenW / 880, 0.74, 1.15)`); the iPhone's display is
  320×693 points (×1.35 in Full Resolution). Each window is drawn twice (Mac copy in the HTML, iPhone
  copy cloned at boot, `aria-hidden`, ids stripped); scroll, `<details>` and form fields are mirrored
  (`twin()`).
- **Display arrangement follows the real position** (`arrange()`): iPhone left / right / above the
  Mac, vertically aligned with where it physically is. Windows on the iPhone ride along with it.
  Dragging a window maps the pointer through whichever screen it is over (`worldPt`, nearest screen in
  the gap between them).
- Kept from the real apps: menu bar status item "LilDisplay · Code 42" with a cut-down 3.3 menu
  (status, Pairing Code › QR, Display Quality ›, Reconnect, Help & Support…, Quit); iOS idle screen
  ("Connect your iPhone via USB", steps Plug USB / Mac app / Swipe up, "Swipe up to connect"), sheet
  with WiFi | USB, the saved code (pair once) and Connect/Disconnect; "Connection lost" when the cable
  comes out. Removed on purpose: Remote/Trackpad modes in the model, keyboard, gestures demo,
  Spaces, Mission Control, Launchpad, Spotlight, lid, Terminal/Music/Photos, the quest cards outside.

**Physics** (one rAF loop at 120 Hz substeps, sleeps when everything has settled)
- Bodies `mac` and `ph`: gravity 2600 px/s², floor = desk, walls, bounce (phone 0.3, Mac 0.1), squash
  on landing, tilt spring while carried (lags like a held object). Throw = pointer velocity on release
  (Mac at 55%). A heavy Mac landing makes the iPhone hop.
- Clip: drop the iPhone within ~44 px of the lid's side → it snaps on (`mount`), and rides with the
  Mac. Falling onto the lid's top edge rests it there (`mount top`).
- Cable: 34 Verlet points, pinned straight out of each port (`PLUG` 22 px), floor friction. Its
  length is a max distance between the ports (`tether()`): it holds a carried iPhone back (stretching
  a little), the Mac tows the iPhone, a free iPhone swings on it. Pulled ~170 px past its length while
  carrying the iPhone → it pops out (`unplug(true)`, the plug recoils). Drag the loose plug (or the
  iPhone) to the port to plug it back; the iPhone then shows "Swipe up to connect" again.
- Grab the cable anywhere to swing it; lift the iPhone by it.
- Packets ride the cable only while a screen changes (the real Mac app sends frames only then):
  green Mac → iPhone, yellow for touches going back. WiFi shows a dotted arc instead.

**Quests** (the Notes window on the Mac, `localStorage['ld.quests']`): drag the note to the other
screen, throw the iPhone, yank and replug, turn it, clip it to the side, open the LilDisplay menu.
Clicking an item shows a hint bubble on the desk (`hintFor`). Phones don't show the note (no room).

**Test hooks**: `?sim=unplugged|idle|wifi|floor|right|menu|notesphone|landscape|portrait|done`,
`window.__ld` (state, bodies, `unplug`, `plugIn`, `connect`, `rotatePhone`, `step(n)` runs physics
substeps). Headless Chrome fires only a few rAF frames, so `tests/t_lildisplay.js` drives physics with
`__ld.step()`; it runs with `--motion` (added to `run_tests.sh`). Smooth scrolling doesn't advance in
headless either.

**Known limits**: on a phone the Mac's screen is small, so the site reads like a little window
(about 170 px of text height at 390 px wide); the green button / Help menu still work there.

**Second round, same day (Saeed):** a gap between the iPhone and the Mac; both float and **stay exactly where
they are dropped** (no gravity, no throw, no clip-on; only the cable can tug them; the desk is a lower
limit). The Mac is ~25% bigger (`macW ≈ (vw − 120) / 1.24`, lifted `G.lift` above the desk) and the cable
starts as a **U** hanging under both ports (`ropeInit`). Pressing a window on the Mac makes the iPhone's
screen blink green ("Drop it here", `#phDrop`) and the Mac's edge facing it pulse with an arrow
(`#macEdge`); while dragging over the iPhone it turns solid ("Release to drop"). The iPhone menu has the
app's **Portrait | Landscape** row; turning keeps the phone's size (width and height swap). Quests now:
note to the other screen, iPhone to the other side, swing the cable, yank + replug, turn, open the menu.

**Third round:** a live **Terminal** window on the Mac (under Notes, Dock icon `>_`). It loops a session
(`swift build` with a progress bar → `swift test` with a spinner → `git push` → `lildisplay stream` with a
ticking frame/fps line that reads the real connection state) and pauses while closed/minimized/hidden.
Click it ("click to type" in its title bar) to type: `help`, `lildisplay`, `rotate`, `connect`, `yank`,
`build`/`demo`, `ls`, `date`, `echo`, `clear`; after 20 s idle the demo resumes. Both copies mirror its
output, so it can be dragged onto the iPhone and keeps running there. The iPhone's turn button is now a
yellow **"Rotate"** pill with a turn icon above the phone (the phone can't go above y = 52 so it stays on
screen). Letting go of the loose plug within ~48 px of the port snaps it in.

**Fourth round (screen use):** `sizes()` now picks the arrangement that gives the biggest Mac for the window
(`G.layout`: `side` = iPhone beside it, `top` = iPhone on its side above it, always `top` under 700 px),
with a thinner desk, small margins and no width cap. Measured: the Mac is 67–77% of the width at 1280×720,
1440×900, 1920×1080 and 2560×1440 (height-bound on ultrawides), 91–96% in tall windows. The Mac's screen
scales its contents up to 1.35× on big displays (`sm`). If the visitor hasn't moved or turned anything, a
resize re-lays it all out (and turns the iPhone to suit the new layout).

**Fifth round (real app features, swallow, notes, browser):**
- Mac menu is now the complete LilDisplay for Mac 3.3 menu (read from `Sender/Sender/AppDelegate.swift`):
  status + live "60 FPS • 7.9 ms" row, optional "CPU 3% • RAM 31 MB", Pairing Code › QR (real hint text),
  Display Quality ›, Reconnect, Permissions (Screen Recording / Accessibility — Enabled, Fix Permissions
  After Update… with the real alert), Advanced › (Keep Awake When Lid Is Closed with the real alert, Show CPU
  & Memory Usage, New Pairing Code), Launch at Login, Help & Support…, Quit (asks about Keep Awake like the
  app). The status item reads "● LilDisplay · Code NN" while waiting and "● LilDisplay" (green) connected.
- (A lid you could close was tried and removed at Saeed's request; Keep Awake is only a menu toggle now.)
- iPhone app (simplified on purpose; no Stats, Dark/Light, Direct/Trackpad rows): trial row, WiFi | USB, the
  two code wheels + Scan (pairs when the Mac menu's QR submenu is open; a wrong code fails), Auto | Portrait |
  Landscape, Display | Remote | Trackpad, the real Connect button (blue ▶ Connect, Cancel while connecting,
  green ■ Disconnect) and the "Not Connected · ☆ Rate LilDisplay" / "USB ◔ 60 ⏱ 8ms" row. Remote shows
  touches. Trackpad: no display on the iPhone, landscape pad with settings (tracking speed, tap to click)
  and ⋯; it drives a pointer on the Mac (tap = click, two fingers / wheel = scroll).
- Windows crossing screens go down the cable as a green lump with a little window inside (`swallow()`),
  along the dotted arc over WiFi.
- Notes: "Set up" (four install steps with the App Store and DMG links, editable, saved in
  `localStorage['ld.note']`, paste is plain text) and "Things to try" tabs.
- Browser: type in the address bar. lilstudio.app pages load inside it (this page itself shows the built-in
  site; framed copies of this page render just the site), YouTube links become embeds, words search
  Wikipedia, other sites load in an iframe with an "Open in a new tab" bar (many sites refuse framing).
  ‹ › ↻ work, a loading bar runs. Same-site links in the site open inside the Mac too.
- Screen 10% taller (16:11), contents scaled `sw / 840`, bigger default browser window.

**Sixth round (less text):** the website inside the Mac is trimmed to hero, stats, three modes, six short
features, photos, pricing, seven FAQs (JSON-LD regenerated to match) and a one-line contact; What's New,
gestures and setup were removed from it (setup lives in the Notes "Set up" tab; the support page and the
`vs-*` guides keep the longer answers). The desk now carries a short headline and one line of "Live" copy
(`.desk-copy`), with a slightly taller desk. Terminal is shorter and sits above the Dock.

**Seventh round:** the lid feature is gone (Saeed didn't want it). The desk shows the headline + "Live" line on
the left and three fact cards on the right (`.desk-facts`: iPhone & iPad as a Mac display · USB or WiFi, no
router · $2.99 once, Mac app free), hidden under 700 px.

**Eighth round:** the headline, "Live" line, fact cards (only ≥ 1760 px wide, so the bar stays one row) and
two big download buttons (App Store, Mac DMG) sit in a top bar (`.topbar`); `sizes()` measures it
(`G.top`) and keeps the Mac and the Rotate pill below it. The desk is thin again. Turning the iPhone
sideways next to the Mac gently pushes the Mac away (`makeRoom()` / `animateMac()`; it narrows only if the
window has no room, the iPhone keeps its size) and turning it upright brings the Mac back. The Mac's
desktop is tiled with 8-point gutters: Notes over Terminal in a left column (35%), the browser fills the rest.
- "⠿ Drag to move" grips (`.grip`): under the Mac (`.mac-grip`), and above the iPhone next to Rotate
  (`.ph-tools`) because the cable leaves the iPhone's bottom. Any pointerdown on them starts the device drag.

## 12. "Big Mac" heroes for LilStats, LilDock, LilHide, LilVibe, LilSnap, LilDim (2026-11-14, local, not pushed)

Saeed: same simple idea as LilDisplay for these six — keep each page's design and content, but make the
hero a MacBook that fills almost the whole first screen, with the details below for scrolling, and make it
obvious what to do (highlight/glow where to click or look).

Applied by **`docs/tools/bigmac/bigmac.py <appid>…`** (re-running replaces a previous conversion). It adds,
to each page, without touching the page's own model code:
- CSS (`/* ===== Big Mac hero` block at the end of the head style) and `class="hero big"` on the hero.
- Two layouts, chosen by the window's shape only (never flips while fonts load): **side** (window ≥ 1000 px
  and width/height ≥ 1.42) = the Mac takes the full height on the left, a 300 px column on the right with
  icon, headline, subtitle (clamped), download button, the guide and the page's chips; **stacked** = a
  compact header row (icon · headline/subtitle · guide · button) above the Mac, chips under it. The Mac is
  sized to the space left (`--mac-w`, JS `fit()`), measured: 67–75% of the width on 1280–2560 px laptops and
  desktops, ~96% in tall windows. Privacy notice and the "LIVE" line are hidden in the hero (the guide
  replaces them). The "N things to try" cards, stats and every section stay below.
- **Guide** (`#guide`): "Step n / N · title · description · ▶ Show me · Skip". It reads the page's own
  `#quests` list (MutationObserver), so it advances when a quest is done; Show me clicks that quest's own
  Show me button; Skip is per visit.
- **Glow** (`#mkGlow`, fixed, pulsing in the page's `--primary`, label like "Click here"): on the element to
  use next, from `TARGETS[appid][questId] = (label, [candidates])` in the script — the first visible
  candidate wins, so it starts on the menu-bar item and moves to Settings rows, menu items, the keys under
  the Mac, a window's green button, etc. It follows the element every 140 ms and on scroll/resize, and hides
  while a "Show me" ghost pointer runs.
- The base scales with the Mac (3% of its width, 18–46 px).
- Test: `docs/tools/tests/t_bigmac.js` (run for all six at 1440×900 and 820×1180 by `run_tests.sh`).
- Changing a page's quests means updating its entry in `TARGETS` and re-running the script.
