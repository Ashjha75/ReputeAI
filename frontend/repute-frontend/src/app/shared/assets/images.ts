function getBaseHref(): string {
  try {
    if (typeof document !== 'undefined') {
      const baseEl = document.querySelector('base');
      const href = baseEl?.getAttribute('href') ?? '/';
      return href.endsWith('/') ? href : href + '/';
    }
  } catch {
    // Browser globals unavailable during SSR or prerendering
  }
  return '/';
}

function imagePath(relativePath: string): string {
  const base = getBaseHref();
  return base + relativePath.replace(/^\//, '');
}

export function assetPath(relativePath: string): string {
  return imagePath(relativePath);
}

export const IMAGES = {
  logo: imagePath('logo.png'),
  bannerMap: imagePath('banner-map.png'),
  bannerReport: imagePath('banner-report.png'),
  bannerNotification: imagePath('banner-notification.png'),
  feature1: imagePath('features-1.png'),
  feature2: imagePath('features-2.png'),
  feature3: imagePath('features-3.png')
};

export type ImageKey = keyof typeof IMAGES;

export default IMAGES;
