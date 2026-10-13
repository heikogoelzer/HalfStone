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
let invertToggle;
let cnv;
let bgColor;
let circleColor;
let backgroundVisible;
let invertGrayToSize;
let grayMin;
let grayMax;

function preload() {
  img_org = loadImage('Lou24.png');
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
  if (img_org) {
    img_org.loadPixels();
    computeGrayRange();
  }
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
  fill(circleColor);

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
      if (radius > 0.25) circle(px, py, radius * 2);
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
    let colorY = height - pad - 100;
    circleLabel.position(colorX - 84, colorY + 6);
    circleColorPicker.position(colorX, colorY);
  }

  if (invertToggle) {
    invertToggle.position(width - 210, height - 150);
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
