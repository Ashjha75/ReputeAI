// Centralized static images module
// Instead of importing binary files (which requires a bundler loader),
// export public-facing URLs for static assets. Place static files in
// `public/` (served from project root) or `src/assets/` depending on
// your angular.json configuration. This module provides a single source
// of truth for image paths used across the app.

// Use the public root `/logo.png` because `angular.json` currently copies
// the `public/` folder into the app's root. If you prefer `src/assets`,
// change the path to `assets/...` accordingly.
export const IMAGES = {
  logo: '/logo.png',
  // Add other images here as keys and string paths as values.
  // e.g. heroIllusion: '/hero-illusion.png' or 'assets/hero-illusion.png'
};

export type ImageKey = keyof typeof IMAGES;

export default IMAGES;
