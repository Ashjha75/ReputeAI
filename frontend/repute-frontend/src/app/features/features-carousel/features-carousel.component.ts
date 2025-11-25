import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate, group, query } from '@angular/animations';

@Component({
  selector: 'app-features-carousel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './features-carousel.component.html',
  styleUrls: ['./features-carousel.component.css'],
  animations: [
    // Animation for the text content sliding in and out
    trigger('slideAnimation', [
      transition(':increment', [ // Handles next slide
        group([
          query(':enter', [
            style({ transform: 'translateX(50px)', opacity: 0 }),
            animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
          ], { optional: true }),
          query(':leave', [
            animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(-50px)', opacity: 0 }))
          ], { optional: true })
        ])
      ]),
      transition(':decrement', [ // Handles previous slide
        group([
          query(':enter', [
            style({ transform: 'translateX(-50px)', opacity: 0 }),
            animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
          ], { optional: true }),
          query(':leave', [
            animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(50px)', opacity: 0 }))
          ], { optional: true })
        ])
      ])
    ]),
    // Simple fade animation for the image
    trigger('fadeAnimation', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('600ms ease-in-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class FeaturesCarouselComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  autoPlayInterval: any;
  isAnimating = false;
  @Input() heroImageUrl?: string;
  heroGradient = 'linear-gradient(135deg, rgba(14, 165, 233, 0.35), rgba(59, 130, 246, 0.15))';
  private isBrowser = false;
  private colorCanvas?: HTMLCanvasElement;
  private colorContext?: CanvasRenderingContext2D | null;

  // Updated content specific to ReputeAI
  features = [
    {
      title: 'Scan & Analyze with AI Precision.',
      description: 'Our advanced AI scans thousands of your posts, comments, and interactions across 5+ platforms to uncover hidden reputation risks. Unify your entire digital footprint in one clear, actionable view.',
      buttonText: 'Explore AI Analysis',
      image: '/carousel-scan.png' // IMPORTANT: Replace with a real image path
    },
    {
      title: 'Receive Your Actionable Risk Score.',
      description: 'Every piece of content is given a 0-100 risk score, categorized from Low to Critical. Our dashboard provides a clear explanation for each flagged item, empowering you to take immediate, informed action.',
      buttonText: 'See Your Risk Score',
      image: '/carousel-score.png' // IMPORTANT: Replace with a real image path
    },
    {
      title: 'Proactively Protect Your Brand.',
      description: 'Don\'t wait for a crisis. ReputeAI gives you the tools to manage your digital presence proactively, ensuring your online persona aligns perfectly with your professional brand and company values, 24/7.',
      buttonText: 'Secure Your Brand',
      image: '/carousel-protect.png' // IMPORTANT: Replace with a real image path
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  startAutoPlay(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.autoPlayInterval = setInterval(() => {
        if (!this.isAnimating) {
          this.nextSlide();
        }
      }, 6000);
    }
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextSlide(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.currentSlide = (this.currentSlide + 1) % this.features.length;
    setTimeout(() => { this.isAnimating = false; }, 600); // Match animation duration
  }

  prevSlide(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.currentSlide = (this.currentSlide - 1 + this.features.length) % this.features.length;
    setTimeout(() => { this.isAnimating = false; }, 600);
  }

  goToSlide(index: number): void {
    if (this.isAnimating || index === this.currentSlide) return;
    this.isAnimating = true;
    this.currentSlide = index;
    setTimeout(() => { this.isAnimating = false; }, 600);
  }

  get heroImageSource(): string {
    const fallbackImage = this.features[this.currentSlide]?.image ?? 'assets/images/carousel-scan.png';
    return this.heroImageUrl ?? fallbackImage;
  }

  onHeroImageLoad(event: Event): void {
    if (!this.isBrowser) {
      return;
    }

    const image = event.target as HTMLImageElement;
    if (!image || !image.complete) {
      return;
    }

    const newGradient = this.buildGradientFromImage(image);
    if (newGradient) {
      this.heroGradient = newGradient;
    }
  }

  private buildGradientFromImage(image: HTMLImageElement): string | null {
    const context = this.ensureColorContext();
    if (!context) {
      return null;
    }

    const width = 20;
    const height = 20;
    context.canvas.width = width;
    context.canvas.height = height;
    context.drawImage(image, 0, 0, width, height);
    const data = context.getImageData(0, 0, width, height).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count += 1;
    }

    if (!count) {
      return null;
    }

    const primary = { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
    const accent = this.shiftColor(primary, 1.2);
    return `linear-gradient(135deg, ${this.toRgba(primary, 0.7)} 15%, ${this.toRgba(accent, 0.9)} 85%)`;
  }

  private shiftColor(color: { r: number; g: number; b: number }, factor: number): { r: number; g: number; b: number } {
    const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
    return {
      r: clamp(color.r * factor),
      g: clamp(color.g * factor),
      b: clamp(color.b * factor)
    };
  }

  private toRgba(color: { r: number; g: number; b: number }, alpha = 1): string {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }

  private ensureColorContext(): CanvasRenderingContext2D | null {
    if (this.colorContext) {
      return this.colorContext;
    }

    this.colorCanvas = document.createElement('canvas');
    this.colorContext = this.colorCanvas.getContext('2d');
    return this.colorContext;
  }
}