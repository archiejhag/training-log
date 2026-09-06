import { describe, test, expect } from 'vitest';
import { buildWeekCardSVG, CARD_SIZE } from './shareCard';

const base = {
  dayTiers: ['trained', 'skipped', 'rest', 'none', 'trained', 'none', 'none'],
  letters: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  title: 'This week',
  countMain: '2 / 7',
  countSub: '3 / 7 marked',
};

describe('buildWeekCardSVG', () => {
  test('is a square SVG with the chalk filter defined', () => {
    const svg = buildWeekCardSVG(base);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain(`width="${CARD_SIZE}" height="${CARD_SIZE}"`);
    expect(svg).toContain('<filter id="chalk-edge"');
    expect(svg).toContain('feDisplacementMap');
  });

  test('renders the title, both count lines, and every day letter', () => {
    const svg = buildWeekCardSVG(base);
    expect(svg).toContain('>This week<');
    expect(svg).toContain('>2 / 7<');
    expect(svg).toContain('>3 / 7 marked<');
    for (const l of base.letters) {
      expect(svg).toContain(`>${l}<`);
    }
  });

  test('a trained day is a solid bar, skipped is banded, rest is dotted', () => {
    const svg = buildWeekCardSVG({ ...base, dayTiers: ['trained', 'skipped', 'rest', 'none', 'none', 'none', 'none'] });
    // trained -> one tall filtered rect in amber
    expect(svg).toContain('#c99a4a');
    // skipped -> multiple short rects in the skip colour
    expect((svg.match(/#7c8b93/g) || []).length).toBeGreaterThan(1);
    // rest -> circles in the rest colour
    expect(svg).toContain('<circle');
    expect(svg).toContain('#8fa089');
  });

  test('omits the sub-line when countSub is absent', () => {
    const svg = buildWeekCardSVG({ ...base, countSub: undefined });
    expect(svg).not.toContain('marked');
  });

  test('tolerates short / missing arrays without throwing', () => {
    expect(() => buildWeekCardSVG({ dayTiers: [], letters: [], title: 'x', countMain: '0 / 7' })).not.toThrow();
  });
});
