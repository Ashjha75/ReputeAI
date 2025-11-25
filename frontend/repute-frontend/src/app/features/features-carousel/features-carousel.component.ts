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
      image: 'assets/images/carousel-protect.png' // IMPORTANT: Replace with a real image path
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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
}