# LinguaLens — Bilingual Comic Reader

## What This Is

A single-file PWA (progressive web app) comic reader that lets you load the same comic book issue in two languages and use a **reveal lens** — a circular portal activated by touch-and-hold — to peek at the alternate language page underneath. The primary target device is **iPad via Safari** (add-to-home-screen PWA), with desktop mouse support for development/testing.

The entire app lives in **`comic-reader.html`** — one self-contained HTML file with inline CSS and JS. No build step, no bundler, no framework. Ship by opening the file or serving it from any static host.

---

## Architecture

### Single-File SPA

Everything is in one HTML file. Three logical screens, toggled via `.hidden` class:

| Screen | Element ID | Purpose |
|--------|-----------|---------|
| Welcome/Upload | `#welcomeScreen` | Two upload cards (primary + alternate CBZ), "Open Reader" button |
| Reader | `#readerScreen` | Full-screen page display with reveal lens, HUD overlay, nav |
| Loading | `#loadingOverlay` | Spinner shown during CBZ extraction |

### Data Flow

```
User uploads two CBZ files
  → JSZip extracts images from each
  → Images sorted by filename (natural sort)
  → Object URLs created for each page
  → Stored in `primaryPages[]` and `altPages[]` arrays
  → Each entry: { name: string, blob: Blob, url: string }
```

Pages are paired by index — page 0 of primary pairs with page 0 of alt, etc. This assumes both archives have the same number of pages in the same order (which is the norm for licensed translations).

### The Reveal Lens

This is the core mechanic. How it works:

1. The **top layer** image (`#primaryImg`) displays normally as an `<img>` filling the reader.
2. Behind it, a **lens layer** (`#lensLayer`) contains the alternate language image (`#altImgLens`) sized and positioned to exactly overlap the primary image.
3. The lens layer has `opacity: 0` by default and uses **CSS `clip-path: circle()`** to reveal only a circular region.
4. A decorative **lens ring** (`#lensRing`) draws a gold border around the revealed area.
5. On touch-and-hold (200ms long-press) or mouse-down, the lens activates and tracks the pointer.
6. On touch, the lens center is **offset 40px above** the finger so your hand doesn't block the text.
7. Lifting the finger dismisses the lens.

The `swapped` boolean flips which language is on top vs. underneath. The "Swap Layers" button toggles this.

### Touch Gesture Disambiguation

The reader needs to handle three gestures on the same surface:

| Gesture | Behavior |
|---------|----------|
| Quick tap on left 25% | Previous page |
| Quick tap on right 25% | Next page |
| Quick tap on center | Show/hide HUD |
| Long-press (200ms) + hold | Activate reveal lens |
| Long-press + drag | Move reveal lens |
| Move > 15px before 200ms | Cancel long-press (was a swipe, not a hold) |

### HUD Auto-Hide

The bottom HUD (nav arrows, lens slider, swap button, page indicator) and top header auto-hide after 4 seconds. Any tap on the reader (that isn't a lens interaction) re-shows them.

---

## Design System

### Visual Identity

- **Name**: LinguaLens
- **Aesthetic**: Dark, cinematic comic-reader feel. Deep navy/charcoal backgrounds, warm gold accent.
- **Fonts**: `Anybody` (display/headings, 900 weight), `DM Sans` (body/UI, 400-600)
- **Loaded from**: Google Fonts CDN

### CSS Variables (`:root`)

```css
--bg-deep: #0a0a0f          /* App background */
--bg-surface: #14141f        /* Header, cards */
--bg-card: #1c1c2e           /* Card backgrounds */
--accent: #f0c040            /* Gold — primary action color */
--accent-glow: rgba(240, 192, 64, 0.25)
--text-primary: #e8e4dc      /* Main text */
--text-secondary: #8a8698    /* Subdued text */
--text-muted: #55526a        /* Hints, placeholders */
--success: #40c080           /* Upload confirmation */
--lens-border: rgba(240, 192, 64, 0.7)  /* Lens ring color */
--lens-shadow: rgba(240, 192, 64, 0.3)  /* Lens glow */
```

### Key UI Elements

- **Upload cards**: Dashed border, turn solid green when loaded
- **Language pills**: Gold for primary, purple (#6060e0) for alternate
- **Lens ring**: 3px gold border with glow shadow
- **HUD**: Gradient fade from transparent to dark at bottom, blurred glass buttons

---

## External Dependencies

| Library | Version | Purpose | CDN URL |
|---------|---------|---------|---------|
| JSZip | 3.10.1 | Extract CBZ (zip) archives | `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` |

That's it. No other dependencies. The app uses vanilla JS with direct DOM manipulation.

---

## Current Limitations & Known Issues

### Must Fix
- **CBR (RAR) not supported**: JSZip only handles zip. Need to add a RAR extraction library (e.g., `libunrar.js` or `unrar-wasm`) for CBR files.
- **No pinch-to-zoom**: The reader has `touch-action: none` which blocks native zoom, but there's no custom pinch-zoom implementation yet. This is important for reading small text on iPad.
- **Page count mismatch**: If the two archives have different numbers of pages, the app doesn't handle it gracefully (out-of-bounds on the shorter one). Should clamp or warn.
- **Large file memory**: All pages are held in memory as Object URLs. A 200-page comic with high-res scans could get heavy. Consider lazy loading or page windowing.

### Should Add (Priority Order)
1. **Pinch-to-zoom + pan** — Critical for iPad reading. The lens should work correctly within a zoomed/panned view. This is the hardest feature to get right because the lens coordinates need to account for the zoom transform.
2. **CBR support** — Add `unrar-wasm` or similar. Fall back gracefully if a RAR file is uploaded.
3. **Page thumbnails / scrubber** — A filmstrip or grid view to jump to a specific page.
4. **Bookmark / remember position** — Save current page to localStorage so you resume where you left off.
5. **Swipe to turn pages** — Horizontal swipe gesture (with proper disambiguation from lens drag).
6. **Configurable lens offset** — The 40px upward offset might not feel right for everyone. Could be a setting.
7. **Landscape mode optimization** — Two-page spread view when in landscape on iPad.
8. **Page preloading** — Preload the next/previous page image so page turns feel instant.
9. **Offline PWA** — Add a service worker for full offline capability after first load.

### Nice to Have
- Smooth page-turn animations (slide or fade)
- Haptic feedback when lens activates (if Vibration API available)
- Dark/light theme toggle (currently dark only)
- Support for more archive formats (PDF, EPUB with images)
- Auto-pair pages by analyzing image similarity if filenames don't match
- Multiple alternate languages (not just two)

---

## File Structure

Currently everything is in one file:

```
comic-reader.html    ← The entire app
CLAUDE.md            ← This file (project brief)
```

If the app grows complex enough to warrant splitting, a reasonable structure would be:

```
index.html           ← Shell with viewport meta, PWA manifest link, font imports
styles.css           ← All CSS
app.js               ← Main app logic
lens.js              ← Reveal lens touch/render logic
archive.js           ← CBZ/CBR extraction
manifest.json        ← PWA manifest
sw.js                ← Service worker (offline)
```

But for now, single-file is simpler and easier to deploy. Only split if a specific change demands it.

---

## Development Notes

### Serving Locally
```bash
# Any static server works. Simplest:
python3 -m http.server 8000
# Then open http://localhost:8000/comic-reader.html
```

### Testing the Lens Without Comics
You can test with any two ZIP files containing images. Quick way to make test CBZ files:
```bash
mkdir -p test-en test-es
# Add some numbered image files to each folder
cd test-en && zip -r ../test-english.cbz *.jpg
cd ../test-es && zip -r ../test-spanish.cbz *.jpg
```

### iPad Testing
- Open in Safari, tap Share → Add to Home Screen
- The `apple-mobile-web-app-capable` meta tag makes it run fullscreen
- The manifest sets `display: standalone` and dark theme color
- Safe area insets are respected in the HUD (`env(safe-area-inset-bottom)`)

### Key Code Sections (search landmarks)

| Section | Search for | Purpose |
|---------|-----------|---------|
| State variables | `// ── State ──` | All mutable app state |
| File upload handlers | `filePrimary` | Upload card click/change events |
| CBZ extraction | `async function extractPages` | JSZip unzip + sort + URL creation |
| Page rendering | `function renderPage()` | Sets image sources, updates HUD |
| Lens update | `function updateLens(clientX, clientY)` | Core lens positioning + clip-path |
| Touch handling | `readerEl.addEventListener('touchstart'` | Long-press detection, lens activation |
| Mouse handling | `readerEl.addEventListener('mousedown'` | Desktop lens interaction |
| HUD auto-hide | `function showHud()` | 4-second timeout hide logic |

---

## Design Philosophy

1. **Zero-config reading experience**: Upload two files, start reading. No account, no setup, no bubble mapping. The reveal lens is the only interaction to learn.

2. **iPad-first, but not iPad-only**: Every interaction must work well on a 10-11" touch screen. Desktop mouse is a secondary concern (useful for dev, but the primary user is on iPad).

3. **Single-file simplicity**: Keep it one file as long as possible. No build tools, no node_modules. If someone finds this file, they can open it and it works.

4. **The lens is the product**: Everything else (upload, nav, HUD) is in service of that one magical interaction — touching the page and seeing the other language appear through a little window. Make it feel good. The ring glow, the smooth tracking, the offset so your finger doesn't block — these details matter.

5. **Respect the comic art**: The reader should feel like holding a comic, not like using a software tool. Minimal chrome, dark background, full-bleed pages. The UI gets out of the way.
