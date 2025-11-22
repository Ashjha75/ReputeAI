import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../shared/components/confirm-modal/confirm-modal.component';
import { FeatureModalComponent } from '../../shared/components/feature-modal/feature-modal.component';
import { isPlatformBrowser } from '@angular/common';

// Define the structure for our card data
interface CarouselItem {
  icon: string;
  iconColorClass: string;
  title: string;
  subtitle: string;
  stat1Value: string;
  stat1Label: string;
  stat1ColorClass: string;
  stat2Value: string;
  stat2Label: string;
  stat2ColorClass: string;
  statusLabel: string;
  statusColorClass: string;
  statusBgClass: string;
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

  // --- Carousel Data (The 3 rotating cards) ---
  carouselItems: CarouselItem[] = [
    {
      icon: 'verified_user',
      iconColorClass: 'text-blue-600',
      title: 'Reputation Score',
      subtitle: 'AI Monitoring Active',
      stat1Value: '12k',
      stat1Label: 'Posts Scanned',
      stat1ColorClass: 'text-slate-900',
      stat2Value: '98%',
      stat2Label: 'Safety Score',
      stat2ColorClass: 'text-emerald-600',
      statusLabel: 'System Operational',
      statusColorClass: 'text-emerald-700',
      statusBgClass: 'bg-emerald-50/80 border-emerald-100'
    },
    {
      icon: 'admin_panel_settings',
      iconColorClass: 'text-violet-600',
      title: 'Identity Defense',
      subtitle: 'Dark Web Scan Active',
      stat1Value: '0',
      stat1Label: 'Breaches Found',
      stat1ColorClass: 'text-slate-900',
      stat2Value: '24/7',
      stat2Label: 'Protection',
      stat2ColorClass: 'text-violet-600',
      statusLabel: 'Identity Secure',
      statusColorClass: 'text-violet-700',
      statusBgClass: 'bg-violet-50/80 border-violet-100'
    },
    {
      icon: 'find_in_page',
      iconColorClass: 'text-amber-600',
      title: 'Content Audit',
      subtitle: 'Risk Analysis Running',
      stat1Value: '3',
      stat1Label: 'Flags For Review',
      stat1ColorClass: 'text-amber-600',
      stat2Value: '100%',
      stat2Label: 'Audit Complete',
      stat2ColorClass: 'text-slate-900',
      statusLabel: 'Action Required',
      statusColorClass: 'text-amber-700',
      statusBgClass: 'bg-amber-50/80 border-amber-100'
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
        // Start typing effect for blue text
        this.startTyping();
      }
    } catch (err) {
      console.error('SSR/Prerender error in HeroSectionComponent:', err);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    // Clear typing intervals/timeouts
    try {
      if (this.typingInterval) clearInterval(this.typingInterval);
      if (this.typingRestartTimeout) clearTimeout(this.typingRestartTimeout);
    } catch (e) { /* ignore */ }
  }

  private startCarousel() {
    // Rotate every 5 seconds
    this.carouselInterval = setInterval(() => {
      this.currentCardIndex = (this.currentCardIndex + 1) % this.carouselItems.length;
    }, 5000);
  }

// --- Visual Logic for 3D Stack ---
  getCardStyle(index: number) {
    const itemCount = this.carouselItems.length;
    
    // Calculate relative position
    let relativeIndex = (index - this.currentCardIndex + itemCount) % itemCount;

    // If the card is "behind" the stack (index > 2), hide it completely
    if (relativeIndex > 2) {
        return { opacity: 0, zIndex: -1, pointerEvents: 'none' };
    }

    const isActive = relativeIndex === 0;

    // VISUAL TWEAKS:
    // 1. Active card sits centered and fully opaque.
    // 2. Back cards scale down, move down and to the RIGHT so you can see the stack.
    // 3. Slight rotation for subtle fanning effect.
    const zIndex = 10 - relativeIndex;
    const scale = 1 - (relativeIndex * 0.08);     // 1.0 -> 0.92 -> 0.84
    const translateY = relativeIndex * 18;        // 0px -> 18px -> 36px
    const translateX = relativeIndex * 36;        // 0px -> 36px -> 72px (push to right)
    const rotateZ = -relativeIndex * 2;           // subtle rotate: 0 -> -2deg -> -4deg
    const opacity = isActive ? 1 : (0.55 - (relativeIndex * 0.2)); // 1.0 -> 0.35 -> 0.15

    return {
      'z-index': zIndex,
      'transform': `translateX(${translateX}px) translateY(${translateY}px) rotateZ(${rotateZ}deg) scale(${scale})`,
      'opacity': opacity,
      'filter': isActive ? 'none' : 'blur(0.9px)',
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

  // --- Typing animation for the blue part of the title ---
  fullBlueText = 'Can Trust.';
  typedBlue = '';
  private typingInterval: any;
  private typingIndex = 0;
  // Slightly slower typing for a smoother, more natural reveal
  typingSpeed = 140; // ms per character
  private typingRestartTimeout: any;

  private startTyping() {
    if (!isPlatformBrowser(this.platformId)) return;
    // Ensure previous timers are cleared
    if (this.typingInterval) clearInterval(this.typingInterval);
    if (this.typingRestartTimeout) clearTimeout(this.typingRestartTimeout);

    // reset
    this.typedBlue = '';
    this.typingIndex = 0;
    this.typingInterval = setInterval(() => {
      if (this.typingIndex >= this.fullBlueText.length) {
        // finished typing; clear interval and schedule restart after a pause
        clearInterval(this.typingInterval);
        this.typingInterval = null;
        // pause before restarting (ms)
        const pause = 1200;
        this.typingRestartTimeout = setTimeout(() => {
          // clear typed text with a short fade (handled by CSS if needed) and restart
          this.typedBlue = '';
          this.typingIndex = 0;
          this.startTyping();
        }, pause);
        return;
      }
      this.typedBlue += this.fullBlueText.charAt(this.typingIndex);
      this.typingIndex++;
    }, this.typingSpeed);
  }
}