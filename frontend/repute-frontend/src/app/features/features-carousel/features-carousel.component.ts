import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-features-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features-carousel.component.html',
  styleUrls: ['./features-carousel.component.css'],
})
export class FeaturesCarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('carouselSection', { static: false }) carouselSection!: ElementRef;
  
  currentSlide = 0;
  autoPlayInterval: any;
  isPaused = false;
  isAnimating = false;
  isVisible = true;
  private observer?: IntersectionObserver;

  features = [
    {
      title: 'Text with both iPhone and Android friends, no problem.',
      description: 'With RCS available across Android and iOS*, you can now text seamlessly with either one, share high-quality photos and videos, join and name group chats, and react to texts with any emoji you like. You\'ll also get the latest AI features, too.*',
      buttonText: 'Discover Google Messages',
      buttonLink: '#'
    },
    {
      title: 'Make video calls and share files.',
      description: 'Do not worry, you\'ll still be able to video chat with friends and family on Google Meet and if you want to send files to friends nearby, you\'ve got Quick Share, which works with Android, ChromeOS, and Windows PC devices.*',
      buttonText: 'Explore Quick Share',
      buttonLink: '#'
    },
    {
      title: 'Stay connected everywhere.',
      description: 'Experience seamless connectivity with powerful features that keep you in touch with what matters most. Share moments, collaborate easily, and stay connected across all your devices.',
      buttonText: 'Learn More',
      buttonLink: '#'
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoPlay();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupScrollAnimation();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupScrollAnimation(): void {
    if (isPlatformBrowser(this.platformId) && typeof IntersectionObserver !== 'undefined') {
      // Start invisible for animation
      this.isVisible = false;
      
      setTimeout(() => {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !this.isVisible) {
                this.isVisible = true;
              }
            });
          },
          { threshold: 0.1, rootMargin: '0px' }
        );

        if (this.carouselSection?.nativeElement) {
          this.observer.observe(this.carouselSection.nativeElement);
        }
      }, 100);
    } else {
      // Fallback: show immediately
      this.isVisible = true;
    }
  }

  startAutoPlay(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.autoPlayInterval = setInterval(() => {
        if (!this.isPaused && !this.isAnimating) {
          this.nextSlide();
        }
      }, 6000);
    }
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  nextSlide(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.currentSlide = (this.currentSlide + 1) % this.features.length;
    setTimeout(() => {
      this.isAnimating = false;
    }, 600);
  }

  prevSlide(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.currentSlide = (this.currentSlide - 1 + this.features.length) % this.features.length;
    setTimeout(() => {
      this.isAnimating = false;
    }, 600);
  }

  goToSlide(index: number): void {
    if (this.isAnimating || index === this.currentSlide) return;
    this.isAnimating = true;
    this.currentSlide = index;
    setTimeout(() => {
      this.isAnimating = false;
    }, 600);
  }

  pauseAutoPlay(): void {
    this.isPaused = true;
  }

  resumeAutoPlay(): void {
    this.isPaused = false;
  }
}
