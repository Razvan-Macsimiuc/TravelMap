// ─────────────────────────────────────────────────────────────────────────────
// environment.example.ts — committed template, safe to share
//
// HOW TO SET UP FOR LOCAL DEVELOPMENT:
//   1. Copy this file:  cp environment.example.ts environment.ts
//   2. Create a free Mapbox account at https://account.mapbox.com
//   3. Generate a public token (pk.eyJ…) and paste it below
//   4. environment.ts is gitignored — never commit the real token
//
// PRODUCTION / CI:
//   The CI pipeline injects MAPBOX_TOKEN into environment.prod.ts before build.
//   See .github/workflows/ for the injection step.
// ─────────────────────────────────────────────────────────────────────────────

export const environment = {
  production: false,
  mapboxToken: '', // ← paste your Mapbox public token here (pk.eyJ…)
};
