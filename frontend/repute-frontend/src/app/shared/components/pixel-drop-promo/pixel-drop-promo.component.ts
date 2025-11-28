import { Component, AfterViewInit, ElementRef, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FeatureModalComponent } from '../feature-modal/feature-modal.component';
import { assetPath, IMAGES } from '../../assets/images';

@Component({
  selector: 'app-pixel-drop-promo',
  standalone: true,
  imports: [CommonModule, MatIconModule, FeatureModalComponent],
  templateUrl: './pixel-drop-promo.component.html',
  styleUrls: ['./pixel-drop-promo.component.css']
})
export class PixelDropPromoComponent implements AfterViewInit, OnDestroy {
  @HostBinding('class.in-view') inView = false;
  @ViewChild(FeatureModalComponent) modal!: FeatureModalComponent;
  logo = IMAGES.logo;

  modalContent = {
    badgeLabel: 'AI Monitoring',
    badgeContext: 'Real-time Protection',
    title: 'Continuous Monitoring. Constant Peace of Mind.',
    subtitle: 'Advanced Risk Analysis',
    description: 'ReputeAI’s continuous monitoring engine works 24/7 to scan your digital footprint. Our AI detects emerging risks, flags harmful content, and provides actionable insights to protect your reputation before issues escalate. Stay ahead of the curve with automated alerts and comprehensive reporting.',
    mediaSrc: assetPath('carousel-score.png'), // Consistent with header logo handling
    mediaAlt: 'AI Score Dashboard'
  };

  private io?: IntersectionObserver;

  constructor(private host: ElementRef<HTMLElement>) {}

  openModal() {
    if (this.modal) {
      this.modal.open();
    }
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !this.host?.nativeElement) return;
    this.io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.15) {
          this.inView = true;
        }
      });
    }, { threshold: [0.05, 0.15, 0.5] });
    this.io.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }
}
