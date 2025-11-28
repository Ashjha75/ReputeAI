import { Component, AfterViewInit, ElementRef, HostBinding, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface PromoCard {
  title: string;
  description: string;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'app-pixel-drop-promo',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './pixel-drop-promo.component.html',
  styleUrls: ['./pixel-drop-promo.component.css']
})
export class PixelDropPromoComponent implements AfterViewInit, OnDestroy {
  @HostBinding('class.in-view') inView = false;

  cards: PromoCard[] = [
    {
      title: 'Real-time Monitoring',
      description: 'Instantly track brand mentions across social media, news, and forums with our always-on AI sentinels.',
      icon: 'radar',
      colorClass: 'card-1'
    },
    {
      title: 'Sentiment Analysis',
      description: 'Decode the emotional tone of every interaction using advanced NLP to understand customer perception.',
      icon: 'psychology',
      colorClass: 'card-2'
    },
    {
      title: 'Smart Automation',
      description: 'Trigger automated workflows and responses for common queries while flagging critical issues for human review.',
      icon: 'auto_mode',
      colorClass: 'card-3'
    },
    {
      title: 'Strategic Insights',
      description: 'Transform raw data into actionable strategies with comprehensive dashboards and predictive analytics.',
      icon: 'insights',
      colorClass: 'card-4'
    }
  ];

  private io?: IntersectionObserver;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !this.host?.nativeElement) return;
    
    // Observer for the main component visibility
    this.io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.1) {
          this.inView = true;
        }
      });
    }, { threshold: [0.1] });
    
    this.io.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }
}
