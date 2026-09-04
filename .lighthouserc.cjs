/* Lighthouse CI config — the "fails the build if the shell gets heavy" gate.
   Ceilings below are set from a real `npm run build` measured locally
   (median of 3 runs), with headroom for legitimate growth, not guessed:

     script   ~127 KB gzipped  -> ceiling 160 KB
     total    ~222 KB gzipped  -> ceiling 280 KB
     fonts    ~83 KB (Google Fonts, effectively fixed) -> warn past 100 KB

   The performance *score* is only a warning, not an error. It's measured
   under simulated network/CPU throttling and swings several points between
   runs on a shared CI machine — a floor set too close to "today's number"
   would fail on noise, not on a real regression. The resource-size
   assertions are the actual regression gate: they're deterministic byte
   counts, unaffected by how busy the runner is.

   Re-baseline these numbers (and this comment) after a deliberate,
   understood increase — e.g. lazy-loading the Supabase client would bring
   the script ceiling down a lot; adding a real feature that needs a new
   dependency might justify raising it a little. Don't just bump the number
   to make a CI failure go away without knowing why it grew. */

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 160_000 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 280_000 }],
        'resource-summary:font:size': ['warn', { maxNumericValue: 100_000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
