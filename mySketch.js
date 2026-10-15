let img_org;
let input;
let controls;
let lblSpacing;
let slSpacing;
let lblSize;
let slSize;
let fileLabel;
let output;
let toggleBg;
let bgColorPicker;
let circleColorPicker;
let bgLabel;
let circleLabel;
let rotateToggle;
let swapBtn;
let invertToggle;
let cnv;
let bgColor;
let circleColor;
let backgroundVisible;
let invertGrayToSize;
let rotateGlyphs;
let grayMin;
let grayMax;
let iconImgs = [];
let lblBank;
let selBank;
let pendingIcons = 0;

// Icon banks: each is a directory `<bank>/png/` whose `index.json`
// lists every `<name>_g<NNN>.png` in it (NNN = black-pixel coverage
// %). Add a bank by creating the directory + manifest and listing it
// in BANKS.
const BANKS = ['dots', 'squares', 'animals', 'mixed'];

function preload() {
  img_org = loadImage('Lou24.png');
  selectBank('dots');
}

// p5's loadJSON fills its return value asynchronously, so it cannot
// be iterated inside preload(); read the manifest synchronously.
// loadImage() issued here or from the bank menu registers with p5;
// recolor+redraw once the whole bank is on screen.
function selectBank(bank) {
  let req = new XMLHttpRequest();
  req.open('GET', bank + '/png/index.json', false);
  req.send(null);
  let names = JSON.parse(req.responseText);
  pendingIcons = names.length;
  iconImgs = names.map((name) => ({
    img: loadImage(bank + '/png/' + name, bankLoaded),
    g: parseInt(name.match(/_g(\d+)\.png$/)[1], 10) / 100,
    colored: null,
  }));
}

function bankLoaded() {
  pendingIcons--;
  if (pendingIcons > 0) return;
  if (circleColor) {
    recolorIcons();
    redraw();
  }
}

// Icons are black glyphs on transparency, so tint() cannot recolor
// them; rewrite RGB per pixel and keep the original alpha.
function recolorIcons() {
  for (let ic of iconImgs) {
    let out = ic.img.get();
    out.loadPixels();
    let r = red(circleColor);
    let g = green(circleColor);
    let b = blue(circleColor);
    for (let i = 0; i < out.pixels.length; i += 4) {
      out.pixels[i] = r;
      out.pixels[i + 1] = g;
      out.pixels[i + 2] = b;
    }
    out.updatePixels();
    ic.colored = out;
  }
}

function computeGrayRange() {
  grayMin = 255;
  grayMax = 0;
  if (!img_org || !img_org.pixels) return;
  for (let i = 0; i < img_org.pixels.length; i += 4) {
    let gray = 0.299 * img_org.pixels[i] +
      0.587 * img_org.pixels[i + 1] +
      0.114 * img_org.pixels[i + 2];
    if (gray < grayMin) grayMin = gray;
    if (gray > grayMax) grayMax = gray;
  }
}

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  pixelDensity(4);
  bgColor = color(255);
  circleColor = color(64, 64, 64);
  backgroundVisible = false;
  invertGrayToSize = false;
  rotateGlyphs = false;
  if (img_org) {
    img_org.loadPixels();
    computeGrayRange();
  }
  recolorIcons();
  makeGUI();
  noLoop();
  redraw();
}

function makeGUI() {
  controls = createDiv();
  controls.class('ui-panel');
  let fileWrap = createDiv();
  fileWrap.class('ui-file');
  fileWrap.parent(controls);
  input = createFileInput(handleInput);
  input.parent(fileWrap);
  let pickBtn = createButton('Choose image');
  pickBtn.class('ui-button');
  pickBtn.parent(fileWrap);
  pickBtn.mousePressed(() => input.elt.click());
  fileLabel = createSpan('Lou24.png');
  fileLabel.class('ui-file-name');
  fileLabel.parent(fileWrap);

  lblBank = createP('Icons');
  lblBank.class('ui-label');
  lblBank.parent(controls);
  selBank = createSelect();
  selBank.class('ui-select');
  selBank.parent(controls);
  for (let bank of BANKS) selBank.option(bank);
  selBank.selected('dots');
  selBank.changed(() => selectBank(selBank.value()));

  lblSpacing = createP('Spacing');
  lblSpacing.class('ui-label');
  lblSpacing.parent(controls);
  slSpacing = createSlider(8, 40, 16, 1);
  slSpacing.class('ui-slider');
  slSpacing.parent(controls);
  slSpacing.input(() => redraw());

  lblSize = createP('Radius %');
  lblSize.class('ui-label');
  lblSize.parent(controls);
  slSize = createSlider(0, 100, 50, 1);
  slSize.class('ui-slider');
  slSize.parent(controls);
  slSize.input(() => redraw());

  output = createButton('Save image');
  output.class('ui-button');
  output.mousePressed(() => save(cnv, 'HalfStone.png'));

  toggleBg = createButton('Show');
  toggleBg.class('ui-button');
  toggleBg.mousePressed(() => {
    backgroundVisible = !backgroundVisible;
    toggleBg.html(backgroundVisible ? 'Hide' : 'Show');
    redraw();
  });

  bgLabel = createP('BG');
  bgLabel.class('ui-label');
  bgColorPicker = createColorPicker('#ffffff');
  bgColorPicker.class('ui-color');
  bgColorPicker.input(() => {
    bgColor = color(bgColorPicker.color());
    redraw();
  });

  circleLabel = createP('FG');
  circleLabel.class('ui-label');
  circleColorPicker = createColorPicker('#404040');
  circleColorPicker.class('ui-color');
  circleColorPicker.input(() => {
    circleColor = color(circleColorPicker.color());
    recolorIcons();
    redraw();
  });

  swapBtn = createButton('Swap');
  swapBtn.class('ui-button');
  swapBtn.mousePressed(() => {
    let bgHex = bgColorPicker.value();
    bgColorPicker.value(circleColorPicker.value());
    circleColorPicker.value(bgHex);
    bgColor = color(bgColorPicker.color());
    circleColor = color(circleColorPicker.color());
    recolorIcons();
    redraw();
  });

  rotateToggle = createCheckbox('Rotate', false);
  rotateToggle.class('ui-checkbox');
  rotateToggle.changed(() => {
    rotateGlyphs = rotateToggle.checked();
    redraw();
  });

  invertToggle = createCheckbox('Invert', false);
  invertToggle.class('ui-checkbox');
  invertToggle.changed(() => {
    invertGrayToSize = invertToggle.checked();
    redraw();
  });

  layoutGUI();
}

function draw() {
  background(255);
  if (!img_org || !img_org.width || !img_org.height) return;

  let imgScale = min(width / img_org.width, height / img_org.height);
  let w = img_org.width * imgScale;
  let h = img_org.height * imgScale;
  let x = (width - w) / 2;
  let y = (height - h) / 2;

  let ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  noStroke();
  fill(bgColor);
  rect(x, y, w, h);
  ctx.restore();

  if (backgroundVisible) {
    image(img_org, x, y, w, h);
  }

  let spacing = slSpacing.value();
  let maxRadius = spacing * slSize.value() / 100;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  noStroke();

  for (let py = y + spacing / 2; py < y + h; py += spacing) {
    let iy = floor((py - y) / imgScale);
    for (let px = x + spacing / 2; px < x + w; px += spacing) {
      let ix = floor((px - x) / imgScale);
      let index = (iy * img_org.width + ix) * 4;
      let gray = 0.299 * img_org.pixels[index] +
        0.587 * img_org.pixels[index + 1] +
        0.114 * img_org.pixels[index + 2];
      let range = grayMax - grayMin;
      let grayRatio = range > 0 ? (gray - grayMin) / range : 0.5;
      let radius = maxRadius * (invertGrayToSize ? grayRatio : 1 - grayRatio);
      // Target black fraction of the cell: a full-radius circle
      // (50% of spacing) covers PI/4 of it.
      let target = PI * radius * radius / (spacing * spacing);
      if (target <= 0) continue;
      // Icon and rotation come from a hash of the cell's pixel
      // coordinates, so they stay fixed as Radius % changes (a
      // sequential random stream would shift whenever cells drop
      // in/out of the draw set). Spacing moves cells to new
      // coordinates, so it legitimately reshuffles.
      let h = Math.imul(ix + 1, 0x9e3779b1) ^
        Math.imul(iy + 1, 0x85ebca77);
      h = Math.imul(h ^ (h >>> 13), 0xc2b2ae3d) ^ (h >>> 16);
      // Random-looking icon, scaled so its black area matches target.
      let best = iconImgs[(h >>> 0) % iconImgs.length];
      // Coverage g scales with drawn area, so linear size grows by
      // sqrt(target / g): lower-coverage icons are enlarged.
      let size = spacing * sqrt(target / best.g);
      if (size < 1) continue;
      push();
      translate(px, py);
      if (rotateGlyphs) rotate(PI / 4 * ((h >>> 8) % 8));
      image(best.colored, -size / 2, -size / 2, size, size);
      pop();
    }
  }
  ctx.restore();
}

function handleInput(file) {
  if (file.type !== 'image') {
    console.error('Please choose an image file.');
    return;
  }
  if (fileLabel) fileLabel.html(file.name);
  loadImage(file.data, (imageFile) => {
    imageFile.loadPixels();
    img_org = imageFile;
    computeGrayRange();
    redraw();
  }, (error) => console.error('Image could not be loaded.', error));
}

function layoutGUI() {
  let pad = 12;
  if (controls) controls.position(pad, pad);

  if (output) {
    let buttonY = height - output.size().height - pad;
    output.position(pad, buttonY);
  }

  if (toggleBg && output) {
    let btnW = output.size().width;
    let btnH = output.size().height;
    toggleBg.size(btnW, btnH);
    toggleBg.position(output.x + btnW + pad, output.y);
  }

  if (bgLabel && bgColorPicker) {
    let colorX = width - pad - 92;
    let colorY = height - pad - 44;
    bgLabel.position(colorX - 84, colorY + 6);
    bgColorPicker.position(colorX, colorY);
  }

  if (circleLabel && circleColorPicker) {
    let colorX = width - pad - 92;
    let colorY = height - 162;
    circleLabel.position(colorX - 84, colorY + 6);
    circleColorPicker.position(colorX, colorY);
  }

  if (swapBtn) {
    swapBtn.size(92, 42);
    swapBtn.position(width - pad - 92, height - 116);
  }

  if (invertToggle) {
    invertToggle.position(width - 210, height - 198);
  }

  if (rotateToggle) {
    rotateToggle.position(width - 210, height - 228);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutGUI();
  redraw();
}

function keyPressed() {
  if (key === ' ') fullscreen(!fullscreen());
}
