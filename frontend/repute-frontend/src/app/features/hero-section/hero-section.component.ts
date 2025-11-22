import { Component, OnInit, Inject, ViewChild, PLATFORM_ID } from '@angular/core';
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
export class HeroSectionComponent implements OnInit {

  @ViewChild('featureModal') featureModal?: FeatureModalComponent;
  @ViewChild('confirmModal') confirmModal?: ConfirmModalComponent;

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Animations handled via CSS
  }

  openFeatureModal() {
    this.featureModal?.open();
  }

  closeFeatureModal() {
    this.featureModal?.closeModal();
  }

  handleFeatureCta() {
    this.closeFeatureModal();
  }

  openConfirmModal() {
    this.confirmModal?.open();
  }

  closeConfirmModal() {
    this.confirmModal?.closeModal();
  }

  confirmAction() {
    console.log('Starting scan...');
    this.closeConfirmModal();
  }
}
