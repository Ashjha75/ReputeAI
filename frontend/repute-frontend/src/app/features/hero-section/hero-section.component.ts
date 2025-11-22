import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../shared/components/confirm-modal/confirm-modal.component';
import { FeatureModalComponent } from '../../shared/components/feature-modal/feature-modal.component';

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
  private carouselInterval: any = null; // Initialize as null

  // --- Carousel Data ---
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

  // --- Modal Config ---
  featureModalData = {
    badgeLabel: 'AI Analysis',
    badgeContext: 'Deep Scan Technology',
    title: 'Comprehensive Digital Audit',
    subtitle: 'Real-time | Multi-platform',
    description: 'Our advanced algorithms scan social platforms to identify potential risks.',
    ctaLabel: 'View Sample Report',
    ctaIcon: 'analytics',
    mediaSrc: 'assets/hero-modal-demo.png',
    mediaAlt: 'AI Analysis Dashboard Demo'
  };

  confirmConfig: ConfirmModalConfig = {
    title: 'Start Deep Scan?',
    message: 'This will analyze your public profile data.',
    detail: 'The process typically takes 2-3 minutes.',
    variant: 'info',
    confirmLabel: 'Start Scan',
    cancelLabel: 'Cancel'
  };

  constructor() {}

  ngOnInit(): void {
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  private startCarousel() {
    // Clear any existing interval first to prevent infinite loops
    this.stopCarousel(); 
    
    this.carouselInterval = setInterval(() => {
      this.currentCardIndex = (this.currentCardIndex + 1) % this.carouselItems.length;
    }, 5000);
  }

  private stopCarousel() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  // --- FIXED 3D Stack Logic ---
  getCardStyle(index: number) {
    const itemCount = this.carouselItems.length;
    let relativeIndex = (index - this.currentCardIndex + itemCount) % itemCount;

    // Completely hide anything beyond the top 3 cards to prevent glitches
    if (relativeIndex > 2) {
        return { 
          opacity: 0, 
          zIndex: -1, 
          transform: 'scale(0.8)', 
          pointerEvents: 'none' 
        };
    }

    // Is this the front card?
    const isActive = relativeIndex === 0;

    // Calculations
    const zIndex = 10 - relativeIndex;
    const scale = 1 - (relativeIndex * 0.1);      // 1.0 -> 0.9 -> 0.8
    const translateY = relativeIndex * 15;        // 0px -> 15px -> 30px
    
    // Opacity: Active is 1 (Solid). Back cards fade out quickly.
    const opacity = isActive ? 1 : (0.4 - (relativeIndex * 0.15)); 

    return {
      'z-index': zIndex,
      'transform': `scale(${scale}) translateY(${translateY}px)`,
      'opacity': opacity,
      'filter': isActive ? 'none' : 'blur(1px)', // Blur back cards slightly
      'pointer-events': isActive ? 'auto' : 'none'
    };
  }

  // --- Actions ---
  openFeatureModal() { this.featureModal?.open(); }
  closeFeatureModal() { this.featureModal?.closeModal(); }
  handleFeatureCta() { this.closeFeatureModal(); }
  openConfirmModal() { this.confirmModal?.applyConfig(this.confirmConfig); this.confirmModal?.open(); }
  closeConfirmModal() { this.confirmModal?.closeModal(); }
  confirmAction() { this.closeConfirmModal(); }
}