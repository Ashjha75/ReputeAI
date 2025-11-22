// Centralized static images module
// Instead of importing binary files (which requires a bundler loader),
// export public-facing URLs for static assets. Place static files in
// `public/` (served from project root) or `src/assets/` depending on
// your angular.json configuration. This module provides a single source
// of truth for image paths used across the app.

// Use the public root `/logo.png` because `angular.json` currently copies
// the `public/` folder into the app's root. If you prefer `src/assets`,
// change the path to `assets/...` accordingly.
/**
 * Build an asset path that respects the application's <base href>.
 * This ensures images resolve correctly when the app is hosted under
 * a subpath (for example GitHub Pages at /<repo-name>/).
 */
function getBaseHref(): string {
  try {
    if (typeof document !== 'undefined') {
      const baseEl = document.querySelector('base');
      const href = baseEl?.getAttribute('href') ?? '/';
      return href.endsWith('/') ? href : href + '/';
    }
  } catch (e) {
    // If document isn't available (SSR) or any error occurs, fall back
  }
  return '/';
}

function imagePath(relativePath: string) {
  const base = getBaseHref();
  // strip any leading slash from relativePath and join
  return base + relativePath.replace(/^\//, '');
}

export const IMAGES = {
  // Use 'logo.png' located at the app root (public/logo.png) — resolved using base href
  logo: imagePath('logo.png'),
  // Add other images similarly: imagePath('assets/hero-illusion.png') or imagePath('images/x.png')
};

export type ImageKey = keyof typeof IMAGES;

export default IMAGES;
