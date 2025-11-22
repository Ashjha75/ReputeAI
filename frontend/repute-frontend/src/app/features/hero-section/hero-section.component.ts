import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, ViewChild } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../shared/components/confirm-modal/confirm-modal.component';
import { FeatureModalComponent } from '../../shared/components/feature-modal/feature-modal.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent, FeatureModalComponent],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
})
export class HeroSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private observer?: IntersectionObserver;

  @ViewChild('featureModal') featureModal?: FeatureModalComponent;
  @ViewChild('confirmModal') confirmModal?: ConfirmModalComponent;

  // Updated Data for ReputationGuard Theme
  featureModalData = {
    badgeLabel: 'AI Analysis',
    badgeContext: 'Deep Scan Technology',
    title: 'Comprehensive Digital Audit',
    subtitle: 'Real-time | Multi-platform',
    description:
      'Our advanced algorithms scan Twitter/X, LinkedIn, and GitHub to identify potential risks in your digital footprint. We analyze sentiment, keyword history, and brand alignment.',
    ctaLabel: 'View Sample Report',
    ctaIcon: 'analytics',
    mediaSrc: 'assets/hero-modal-demo.png', // Make sure this image exists or update path
    mediaAlt: 'AI Analysis Dashboard Demo'
  };

  confirmConfig: ConfirmModalConfig = {
    title: 'Start Deep Scan?',
    message: 'This will analyze your public profile data.',
    detail: 'The process typically takes 2-3 minutes. You will be notified when complete.',
    variant: 'info', // Changed from 'delete' to 'info' for a positive action
    confirmLabel: 'Start Scan',
    cancelLabel: 'Cancel'
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
  ngOnInit(): void {
    // Component initialized
  }

  ngAfterViewInit(): void {
    // Only run in browser environment to avoid SSR issues
    if (isPlatformBrowser(this.platformId)) {
      this.observeElements();
      
      // Trigger initial animation
      setTimeout(() => {
        this.addVisibleClass();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private observeElements(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.addVisibleClass();
      return;
    }

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    const fadeElements = document.querySelectorAll('.fade-in-left, .fade-in-right');
    fadeElements.forEach(el => this.observer!.observe(el));
  }

  private addVisibleClass(): void {
    const fadeElements = document.querySelectorAll('.fade-in-left, .fade-in-right');
    fadeElements.forEach(el => {
      el.classList.add('visible');
    });
  }

  // Modal Actions
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

  openConfirmModal(configPatch?: Partial<ConfirmModalConfig>) {
    if (configPatch) {
      this.confirmConfig = { ...this.confirmConfig, ...configPatch };
    }
    this.confirmModal?.applyConfig(this.confirmConfig);
    this.confirmModal?.open();
  }

  closeConfirmModal() {
    this.confirmModal?.closeModal();
  }

  confirmAction() {
    console.log('Starting scan...');
    this.closeConfirmModal();
    // Add logic to trigger service call here
  }
}
