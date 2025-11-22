import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../shared/components/confirm-modal/confirm-modal.component';
import { FeatureModalComponent } from '../../shared/components/feature-modal/feature-modal.component';
import { isPlatformBrowser } from '@angular/common';

// Define the structure for our card data
interface CoolCard {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent, FeatureModalComponent],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
})
export class HeroSectionComponent implements OnInit, OnDestroy {

  @ViewChild('featureModal') featureModal?: FeatureModalComponent;
  @ViewChild('confirmModal') confirmModal?: ConfirmModalComponent;

  // --- Carousel State ---
  currentCardIndex = 0;
  private carouselInterval: any;

  coolCards: CoolCard[] = [
    {
      icon: 'verified_user',
      title: 'Reputation Score',
      subtitle: 'AI Monitoring',
      description: 'Track your online reputation with real-time AI analysis.',
      color: '#e0e7ff'
    },
    {
      icon: 'admin_panel_settings',
      title: 'Identity Defense',
      subtitle: 'Dark Web Scan',
      description: 'Protect your identity with 24/7 dark web monitoring.',
      color: '#f3e8ff'
    },
    {
      icon: 'find_in_page',
      title: 'Content Audit',
      subtitle: 'Risk Analysis',
      description: 'Audit your content for risks and compliance automatically.',
      color: '#fff7e6'
    },
    {
      icon: 'lightbulb',
      title: 'Smart Insights',
      subtitle: 'AI Suggestions',
      description: 'Get actionable insights to improve your digital footprint.',
      color: '#e6fff7'
    },
    {
      icon: 'star',
      title: 'Trust Score',
      subtitle: 'Brand Alignment',
      description: 'See how your brand aligns with audience expectations.',
      color: '#f0e6ff'
    }
  ];

  // --- Modal Data ---
  featureModalData = {
    badgeLabel: 'AI Analysis',
    badgeContext: 'Deep Scan Technology',
    title: 'Comprehensive Digital Audit',
    subtitle: 'Real-time | Multi-platform',
    description:
      'Our advanced algorithms scan Twitter/X, LinkedIn, and GitHub to identify potential risks in your digital footprint. We analyze sentiment, keyword history, and brand alignment.',
    ctaLabel: 'View Sample Report',
    ctaIcon: 'analytics',
    mediaSrc: 'assets/hero-modal-demo.png', 
    mediaAlt: 'AI Analysis Dashboard Demo'
  };

  confirmConfig: ConfirmModalConfig = {
    title: 'Start Deep Scan?',
    message: 'This will analyze your public profile data.',
    detail: 'The process typically takes 2-3 minutes. You will be notified when complete.',
    variant: 'info',
    confirmLabel: 'Start Scan',
    cancelLabel: 'Cancel'
  };

  // Fallback image for modal
  fallbackImage = 'assets/fallback.png';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    try {
      if (isPlatformBrowser(this.platformId)) {
        // Start automatic rotation only in browser
        this.startCarousel();
      }
    } catch (err) {
      console.error('SSR/Prerender error in HeroSectionComponent:', err);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  private startCarousel() {
    // Rotate every 5 seconds
    this.carouselInterval = setInterval(() => {
      this.currentCardIndex = (this.currentCardIndex + 1) % this.coolCards.length;
    }, 5000);
  }

// --- Visual Logic for 3D Stack ---
  getCardStyle(index: number) {
    const itemCount = this.coolCards.length;
    
    // Calculate relative position
    let relativeIndex = (index - this.currentCardIndex + itemCount) % itemCount;

    // If the card is "behind" the stack (index > 2), hide it completely
    if (relativeIndex > 2) {
        return { opacity: 0, zIndex: -1, pointerEvents: 'none' };
    }

    const isActive = relativeIndex === 0;

    // VISUAL TWEAKS:
    // 1. Make active card solid (opacity 1).
    // 2. Make back cards very faint (0.4 and 0.2) so text doesn't clash.
    // 3. Scale them down more (0.1 difference) to create depth.
    const zIndex = 10 - relativeIndex;
    const scale = 1 - (relativeIndex * 0.1);     // 1.0 -> 0.9 -> 0.8
    const translateY = relativeIndex * 20;       // 0px -> 20px -> 40px
    const opacity = isActive ? 1 : (0.5 - (relativeIndex * 0.2)); // 1.0 -> 0.3 -> 0.1

    return {
      'z-index': zIndex,
      'transform': `scale(${scale}) translateY(${translateY}px)`,
      'opacity': opacity,
      'filter': isActive ? 'none' : 'blur(1px)', // Blur the back cards slightly
      'pointer-events': isActive ? 'auto' : 'none'
    };
  }


  // --- Modal Actions ---
  openFeatureModal() {
    if (this.featureModal) {
      this.featureModal.open();
    }
  }

  closeFeatureModal() {
    if (this.featureModal) {
      this.featureModal.closeModal();
    }
  }

  handleFeatureCta() {
    this.closeFeatureModal();
  }

  openConfirmModal() {
    if (this.confirmModal) {
      this.confirmModal.applyConfig(this.confirmConfig);
      this.confirmModal.open();
    }
  }

  closeConfirmModal() {
    if (this.confirmModal) {
      this.confirmModal.closeModal();
    }
  }

  confirmAction() {
    this.closeConfirmModal();
    // Service call logic goes here
  }

  // Fallback for missing icons
  getIcon(icon: string): string {
    return icon ? icon : 'help_outline';
  }
}