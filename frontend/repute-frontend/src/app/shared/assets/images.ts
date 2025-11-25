
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

/**
 * Public helper for other modules that need to resolve static asset URLs.
 */
export function assetPath(relativePath: string): string {
  return imagePath(relativePath);
}

export const IMAGES = {
  // Use 'logo.png' located at the app root (public/logo.png) — resolved using base href
  logo: imagePath('logo.png'),
  // Add other images similarly: imagePath('assets/hero-illusion.png') or imagePath('images/x.png')
};

export type ImageKey = keyof typeof IMAGES;

export default IMAGES;
