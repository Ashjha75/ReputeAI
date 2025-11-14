import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../shared/components/confirm-modal/confirm-modal.component';
import { FeatureModalComponent } from '../../shared/components/feature-modal/feature-modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent, FeatureModalComponent],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
})
export class HeroSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private observer?: IntersectionObserver;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
  ngOnInit(): void {
    // Component initialized
  }

  ngAfterViewInit(): void {
    // Only run in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Trigger animations on page load
      this.observeElements();
      
      // Add initial animation trigger
      setTimeout(() => {
        this.addVisibleClass();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Cleanup observer
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private observeElements(): void {
    // Check if IntersectionObserver is available
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: just add visible class immediately
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

    // Observe all fade-in elements
    const fadeElements = document.querySelectorAll('.fade-in-left, .fade-in-right');
    fadeElements.forEach(el => this.observer!.observe(el));
  }

  private addVisibleClass(): void {
    const fadeElements = document.querySelectorAll('.fade-in-left, .fade-in-right');
    fadeElements.forEach(el => {
      el.classList.add('visible');
    });
  }

  @ViewChild('featureModal') featureModal?: FeatureModalComponent;
  @ViewChild('confirmModal') confirmModal?: ConfirmModalComponent;

  featureModalData = {
    badgeLabel: 'Android 16',
    badgeContext: 'Hearing device support',
    title: 'Clearer calling with hearing devices.',
    subtitle: 'June 2025 | Accessibility',
    description:
      'Control hearing devices from your device for a simpler experience across different hearing device brands. Or switch to your phone as input with LE Audio hearing devices for clearer calls in noisy environments.',
    ctaLabel: 'Learn more about accessibility',
    ctaIcon: 'open_in_new',
    mediaSrc: 'assets/hero-modal-demo.png',
    mediaAlt: 'Hearing device demo'
  };

  openFeatureModal() {
    this.featureModal?.open();
  }
  closeFeatureModal() {
    this.featureModal?.closeModal();
  }
  handleFeatureCta() {
    // Placeholder for CTA click handling (navigate / analytics etc.)
  }

  confirmConfig: ConfirmModalConfig = {
    title: 'Delete this item?',
    message: 'Removing this item cannot be undone.',
    detail: 'All related data will be removed permanently.',
    variant: 'delete',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel'
  };

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
    // Handle confirmation logic here
    this.closeConfirmModal();
  }
}