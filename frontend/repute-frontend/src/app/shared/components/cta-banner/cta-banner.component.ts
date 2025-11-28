import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, OnDestroy, HostBinding, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import IMAGES from '../../assets/images';

interface CtaCard {
  icon: string;
  iconColor: string;
  variant: 'primary' | 'secondary' | 'accent';
  message: string;
  action: string;
  actionIcon?: string;
  backgroundVideo?: string;
  backgroundPoster?: string;
}

@Component({
  selector: 'app-cta-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './cta-banner.component.html',
  styleUrl: './cta-banner.component.css'
})
export class CtaBannerComponent implements AfterViewInit, OnDestroy {
  @Input() icon: string = 'local_offer';
  @Input() iconColor: string = '#1967d2';
  @Input() variant: 'primary' | 'secondary' | 'accent' = 'primary';
  
  @HostBinding('class.in-view') inView = false;
  
  private io?: IntersectionObserver;
  private autoPlayTimer?: any;

  // Carousel state
  currentIndex = 0;
  isTransitioning = false;
  private lastBackgroundVideo: string | null = null;
  private refreshScheduled = false;
  @ViewChild('ctaVideo') ctaVideo?: ElementRef<HTMLVideoElement>;

  // Pre-defined carousel cards
  cards: CtaCard[] = [
    {
      icon: 'notifications_active',
      iconColor: '#1976d2',
      variant: 'primary',
      message: 'Get real-time alerts when risks are detected. Stay ahead with instant AI-powered notifications.',
      action: 'Enable Alerts',
      actionIcon: 'notifications',
      backgroundVideo: IMAGES.bannerBg5,
      backgroundPoster: IMAGES.bannerNotification
    },
    {
      icon: 'insights',
      iconColor: '#7c3aed',
      variant: 'accent',
      message: 'Generate comprehensive reports on your digital reputation. Export insights in seconds.',
      action: 'View Reports',
      actionIcon: 'assessment',
      backgroundVideo: IMAGES.bannerBg2,
      backgroundPoster: IMAGES.bannerReport
    },
    {
      icon: 'security',
      iconColor: '#059669',
      variant: 'secondary',
      message: 'Connect all your platforms securely. Monitor your entire digital footprint in one place.',
      action: 'Connect Now',
      actionIcon: 'link',
      backgroundVideo: IMAGES.bannerBg4,
      backgroundPoster: IMAGES.bannerMap
    }
  ];

  get currentCard(): CtaCard {
    return this.cards[this.currentIndex];
  }

  get currentBackgroundVideo(): string | null {
    return this.currentCard.backgroundVideo ?? null;
  }

  get currentBackgroundPoster(): string | null {
    return this.currentCard.backgroundPoster ?? null;
  }

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !this.host?.nativeElement) return;

    this.io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
          this.inView = true;
          this.startAutoPlay();
        } else {
          this.stopAutoPlay();
        }
      });
    }, { threshold: [0, 0.15, 0.3, 0.5] });

    this.io.observe(this.host.nativeElement);
    this.refreshBackgroundVideo();
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.stopAutoPlay();
  }

  nextCard(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
    this.scheduleBackgroundVideoRefresh();
    setTimeout(() => this.isTransitioning = false, 600);
    this.resetAutoPlay();
  }

  prevCard(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
    this.scheduleBackgroundVideoRefresh();
    setTimeout(() => this.isTransitioning = false, 600);
    this.resetAutoPlay();
  }

  goToCard(index: number): void {
    if (this.isTransitioning || index === this.currentIndex) return;
    this.isTransitioning = true;
    this.currentIndex = index;
    this.scheduleBackgroundVideoRefresh();
    setTimeout(() => this.isTransitioning = false, 600);
    this.resetAutoPlay();
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      this.nextCard();
    }, 5000);
  }

  private stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = undefined;
    }
  }

  private resetAutoPlay(): void {
    this.stopAutoPlay();
    if (this.inView) {
      this.startAutoPlay();
    }
  }

  private scheduleBackgroundVideoRefresh(): void {
    if (this.refreshScheduled) {
      return;
    }
    this.refreshScheduled = true;
    Promise.resolve().then(() => {
      this.refreshScheduled = false;
      this.refreshBackgroundVideo();
    });
  }

  private refreshBackgroundVideo(): void {
    const videoSrc = this.currentBackgroundVideo;
    if (this.lastBackgroundVideo === videoSrc) {
      return;
    }
    this.lastBackgroundVideo = videoSrc;
    const videoEl = this.ctaVideo?.nativeElement;
    if (!videoEl || !videoSrc) {
      return;
    }
    videoEl.load();
    videoEl.play().catch(() => { /* ignore autoplay restrictions */ });
  }
}
