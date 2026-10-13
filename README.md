# HalfStone

A p5.js sketch that converts an image into a halftone-style grid of circles:
a regular grid is laid over the image and each circle's radius follows the
local gray value. The source image itself is hidden by default — only the
dot rendering is shown.

## Rendering

- Circle centers sit on a regular grid; the darkest pixel of the loaded
  image gets the largest circle, the brightest pixel gets ~zero radius.
- Gray values are normalized against the image's actual min/max gray
  (computed once per image), so the largest circle always reaches the
  slider value regardless of the image's tonal range.
- **Radius %** is a percentage of the grid spacing (default 50%): at 50%
  the largest circles just touch their neighbors. Changing spacing scales
  the dots proportionally — the slider value never changes.
- **Invert** flips the mapping (brightest → largest circle).

## Controls

- **Choose image** — load a different image (starts with `Lou24.png`).
- **Spacing** — grid distance in canvas pixels (8–40, default 16).
- **Radius %** — max circle radius as % of spacing (0–100, default 50).
- **Show / Hide** — toggle the source image under the dots (hidden by
  default).
- **BG / FG** — background and circle colors.
- **Invert** — flip gray-to-size mapping.
- **Save image** — downloads the canvas as `halfstone.png` at 4× window
  resolution (`pixelDensity(4)`).
- **Spacebar** — toggles fullscreen.

## Running

Serve the folder over HTTP and open `index.html`:

    python3 -m http.server

Then visit <http://localhost:8000>. (A server is required because p5's
`loadImage` and the file input do not work from `file://`.)

## Files

- `index.html` — page shell, p5.js 1.11.3 loader, SW registration.
- `mySketch.js` — image loading, gray-range computation, dot rendering,
  and controls.
- `style.css` — control panel styling (system font, vw-scaled controls).
  The font is set on `body` because BG/FG/Invert labels are positioned
  directly on `<body>`, outside the panel.
- `sw.js` — service worker, **network-first** fetch: fresh assets
  whenever online, cached fallback when offline. The runtime cache
  updates itself, so `CACHE_NAME` only needs bumping for structural
  changes (e.g. renamed/removed cached files). Registered with the
  relative path `./sw.js` so it also works when the app is served from
  a subdirectory (GitHub Pages project site `/halfstone/`).
- `manifest.json` — installable app metadata.
