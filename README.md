# HalfStone

A p5.js sketch that converts an image into a halftone-style grid of
glyphs (circles, squares, or animal icons): a regular grid is laid over
the image and each glyph's size follows the local gray value. The
source image itself is hidden by default — only the glyph rendering is
shown.

## Rendering

- Glyph centers sit on a regular grid; the darkest pixel of the loaded
  image gets the largest glyph, the brightest pixel gets ~zero size.
- Each glyph comes from an **icon bank**: a folder `dots/`, `squares/`,
  or `animals/` of 100×100 black PNGs (`<name>_g<NNN>.png`, NNN = the
  glyph's black-coverage %) plus an `index.json` manifest. Glyph and
  rotation come from a per-cell hash of the cell's pixel coordinates,
  so changing Radius % does not reshuffle the pattern.
- Glyphs are scaled so the black area matches the target circle area
  (`spacing·√(target/g)`), and recolored pixel-by-pixel to the FG
  color (the glyphs are black-on-transparent).
- Gray values are normalized against the image's actual min/max gray
  (computed once per image), so the largest glyph always reaches the
  slider value regardless of the image's tonal range.
- **Radius %** is a percentage of the grid spacing (default 50%): at 50%
  the largest circles just touch their neighbors. Changing spacing scales
  the glyphs proportionally — the slider value never changes.
- **Invert** flips the mapping (brightest → largest glyph).

## Controls

- **Choose image** — load a different image (starts with `Lou24.png`).
- **Icons** — switch icon bank: dots, squares, animals (default dots).
- **Spacing** — grid distance in canvas pixels (8–40, default 16).
- **Radius %** — max glyph size as % of spacing (0–100, default 50).
- **Show / Hide** — toggle the source image under the glyphs (hidden by
  default).
- **BG / FG** — background and glyph colors.
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
- `mySketch.js` — image loading, gray-range computation, icon banks,
  glyph rendering, and controls.
- `dots/`, `squares/`, `animals/` — icon banks: `<name>_g<NNN>.png`
  100×100 glyphs + `index.json` manifest each. To add a bank, create
  `<bank>/png/` and add its name to the `BANKS` array in `mySketch.js`.
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
