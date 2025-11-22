import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../shared/components/confirm-modal/confirm-modal.component';
import { FeatureModalComponent } from '../../shared/components/feature-modal/feature-modal.component';

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

  constructor() {}

  ngOnInit(): void {
    // Start automatic rotation
    this.startCarousel();
  }

  ngOnDestroy(): void {
    // Stop rotation to prevent memory leaks
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
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
    
    // Math to determine how "far" this card is from the current active one
    // This handles the "wrap around" logic (e.g., going from index 2 back to 0)
    let relativeIndex = (index - this.currentCardIndex + itemCount) % itemCount;

    // If the card is "behind" the stack (index > 2), keep it hidden/flat at position 3
    if (relativeIndex > 2) {
        relativeIndex = 3; 
    }

    // Visual Calculation
    const zIndex = 10 - relativeIndex;                // Active card on top (10), others below
    const scale = 1 - (relativeIndex * 0.05);         // Shrink cards further back (1 -> 0.95 -> 0.90)
    const translateY = relativeIndex * 15;            // Push cards further back down (0px -> 15px -> 30px)
    const opacity = relativeIndex > 2 ? 0 : (1 - (relativeIndex * 0.2)); // Fade out back cards

    return {
      'z-index': zIndex,
      'transform': `scale(${scale}) translateY(${translateY}px)`,
      'opacity': opacity,
      'pointer-events': relativeIndex === 0 ? 'auto' : 'none' // Only click active card
    };
  }

  // --- Modal Actions ---
  openFeatureModal() {
    this.featureModal?.open();
  }

  closeFeatureModal() {
    this.featureModal?.closeModal();
  }

  handleFeatureCta() {
    console.log('Navigate to sample report or detailed analysis page');
    this.closeFeatureModal();
  }

  openConfirmModal() {
    this.confirmModal?.applyConfig(this.confirmConfig);
    this.confirmModal?.open();
  }

  closeConfirmModal() {
    this.confirmModal?.closeModal();
  }

  confirmAction() {
    console.log('Starting scan...');
    this.closeConfirmModal();
    // Service call logic goes here
  }
}