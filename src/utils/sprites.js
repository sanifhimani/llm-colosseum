function drawPixels(ctx, px, py, scale, pixels, palette) {
  for (let r = 0; r < pixels.length; r++) {
    const row = pixels[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ' ') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(px + c * scale),
        Math.round(py + r * scale),
        Math.ceil(scale),
        Math.ceil(scale),
      );
    }
  }
}

function spriteClaude(ctx, px, py, s, col) {
  drawPixels(ctx, px, py, s, [
    ' .OOO. ',
    ' OOOOO ',
    ' O###O ',
    '.OOOOO.',
    'OOOOOOO',
    '.O.O.O.',
    ' O   O ',
    ' OO OO ',
  ], { O: col, '#': '#111', '.': '#c8a060' });
}

function spriteGpt(ctx, px, py, s, col) {
  drawPixels(ctx, px, py, s, [
    ' .XXX. ',
    ' X###X ',
    ' X.#.X ',
    '.XXXXX.',
    'XXXXXXX',
    '.X.X.X.',
    ' XX.XX ',
    ' X   X ',
  ], { X: col, '#': '#eee', '.': '#222' });
}

function spriteGemini(ctx, px, py, s, col) {
  drawPixels(ctx, px, py, s, [
    '  .BB. ',
    ' BBBBB ',
    ' B***B ',
    '.BBBBB.',
    'BBBBBBB',
    ' B.B.B ',
    ' B   B ',
    '.BB.BB.',
  ], { B: col, '*': '#aaddff', '.': '#88bbff' });
}

function spriteGrok(ctx, px, py, s, col) {
  drawPixels(ctx, px, py, s, [
    ' .GGG. ',
    ' G.G.G ',
    ' GGGGG ',
    '.G.#.G.',
    'GGGGGGG',
    '.GG.GG.',
    ' G   G ',
    ' G   G ',
  ], { G: col, '#': '#222', '.': '#606068' });
}

function spriteDefault(ctx, px, py, s, col) {
  drawPixels(ctx, px, py, s, [
    ' .###. ',
    ' ##### ',
    ' ##.## ',
    '.#####.',
    '#######',
    '.#.#.#.',
    ' #   # ',
    ' ## ## ',
  ], { '#': col, '.': '#888' });
}

const BUILDERS = {
  claude: spriteClaude,
  gpt: spriteGpt,
  gemini: spriteGemini,
  grok: spriteGrok,
};

export function drawAgentSprite(ctx, agentId, px, py, scale, color) {
  const fn = BUILDERS[agentId] || spriteDefault;
  fn(ctx, px, py, scale, color);
}
