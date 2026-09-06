/* "Share your week" — a chalk-styled PNG of the weekly strip.

   Built as a self-contained SVG string so the #chalk-edge turbulence
   filter travels with it, rasterised on a <canvas>, then handed to the
   Web Share API where file sharing is supported, or downloaded otherwise.

   The card is always the dark chalkboard, whatever theme the app is in —
   that palette is the identity, so the tokens are hardcoded here rather
   than read from CSS. Only day letters, a date label and counts go in;
   nothing free-form, so the string interpolation is safe. */

const BOARD = '#2a2d2b';
const CHALK = '#edece6';
const CHALK_DIM = '#a6a9a0';
const HAIRLINE = 'rgba(237, 236, 230, 0.2)';
const AMBER = '#c99a4a';
const SKIP = '#7c8b93';
const REST = '#8fa089';

export const CARD_SIZE = 1080;

const LEFT = 150;
const RIGHT = 930;
const BASE_Y = 660; // baseline the strokes grow up from
const MAX_H = 300;
const COL_W = 16;

// A degree or two of lean per column, echoing the app's .strip leans.
const LEANS = [-1.6, 1, -0.5, 1.4, -1.1, 0.6, -1.3];

function column(tier, x, lean) {
  const rot = `rotate(${lean} ${x} ${BASE_Y})`;
  const half = COL_W / 2;

  if (tier === 'trained') {
    return `<rect x="${x - half}" y="${BASE_Y - MAX_H}" width="${COL_W}" height="${MAX_H}" rx="7" fill="${AMBER}" transform="${rot}" filter="url(#chalk-edge)"/>`;
  }
  if (tier === 'skipped') {
    let bands = '';
    for (let i = 0; i < 6; i++) {
      const y = BASE_Y - MAX_H + i * 52;
      bands += `<rect x="${x - half}" y="${y}" width="${COL_W}" height="32" rx="6" fill="${SKIP}"/>`;
    }
    return `<g transform="${rot}" filter="url(#chalk-edge)">${bands}</g>`;
  }
  if (tier === 'rest') {
    let dots = '';
    for (let i = 0; i < 7; i++) {
      const cy = BASE_Y - MAX_H + 14 + i * 45;
      dots += `<circle cx="${x}" cy="${cy}" r="8" fill="${REST}"/>`;
    }
    return `<g transform="${rot}" filter="url(#chalk-edge)">${dots}</g>`;
  }
  // unmarked: a short stub at the baseline
  return `<rect x="${x - half}" y="${BASE_Y - 16}" width="${COL_W}" height="16" rx="7" fill="${HAIRLINE}" transform="${rot}"/>`;
}

/** Pure: the strip as an SVG string.
 *  dayTiers  string[7] — 'trained' | 'skipped' | 'rest' | 'none'
 *  letters   string[7] — single-letter weekday labels, in display order
 *  title     e.g. "This week" or "18–24 Aug"
 *  countMain e.g. "3 / 7" or "3 / 4"
 *  countSub  optional quiet second line, e.g. "3 / 7 marked" */
export function buildWeekCardSVG({ dayTiers, letters, title, countMain, countSub }) {
  const gap = (RIGHT - LEFT) / 6;
  let cols = '';
  for (let i = 0; i < 7; i++) {
    const x = LEFT + gap * i;
    cols += column(dayTiers[i] ?? 'none', x, LEANS[i]);
    cols += `<text x="${x}" y="${BASE_Y + 66}" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="36" fill="${CHALK_DIM}">${letters[i] ?? ''}</text>`;
  }

  const sans = "'Helvetica Neue', Arial, sans-serif";
  const mono = 'ui-monospace, Menlo, monospace';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_SIZE}" height="${CARD_SIZE}" viewBox="0 0 ${CARD_SIZE} ${CARD_SIZE}">` +
    '<defs>' +
    '<filter id="chalk-edge" x="-40%" y="-40%" width="180%" height="180%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed="7" stitchTiles="stitch" result="noise"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>' +
    '</filter>' +
    '</defs>' +
    `<rect width="${CARD_SIZE}" height="${CARD_SIZE}" fill="${BOARD}"/>` +
    `<text x="${LEFT}" y="140" font-family="${mono}" font-size="30" letter-spacing="7" fill="${CHALK_DIM}">SLATE</text>` +
    `<text x="${LEFT}" y="232" font-family="${sans}" font-weight="700" font-size="76" fill="${CHALK}">${title}</text>` +
    cols +
    `<text x="${LEFT}" y="${BASE_Y + 200}" font-family="${sans}" font-weight="700" font-size="64" fill="${CHALK}">${countMain}</text>` +
    (countSub
      ? `<text x="${LEFT}" y="${BASE_Y + 250}" font-family="${mono}" font-size="30" fill="${CHALK_DIM}">${countSub}</text>`
      : '') +
    '</svg>'
  );
}

/** SVG string -> PNG Blob, via an <img> and a <canvas>. */
export function svgToPngBlob(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CARD_SIZE;
      canvas.height = CARD_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, CARD_SIZE, CARD_SIZE);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not render the image'))),
        'image/png',
      );
    };
    img.onerror = () => reject(new Error('Could not render the image'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

/** Share the PNG via the Web Share API (mobile), or download it. */
export async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      // any other failure: fall through to a download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
