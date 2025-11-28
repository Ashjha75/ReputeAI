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
  feature3: imagePath('features-3.png'),
  heroModalDemo: imagePath('hero-modal-demo.png'),
  carouselAiScore: imagePath('carousel-ai-score.png'),
  // Videos
  bannerBg1: imagePath('banner-bg-1.mp4'),
  bannerBg2: imagePath('banner-bg-2.mp4'),
  bannerBg3: imagePath('banner-bg-3.mp4'),
  bannerBg4: imagePath('banner-bg-4.mp4'),
  bannerBg5: imagePath('banner-bg-5.mp4'),
  pixelArea: imagePath('pixel-area.mp4')
};

export type ImageKey = keyof typeof IMAGES;

export default IMAGES;
