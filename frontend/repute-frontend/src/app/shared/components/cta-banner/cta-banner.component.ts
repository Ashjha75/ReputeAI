import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !this.host?.nativeElement) return;

    this.io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          this.inView = true;
        }
      });
    }, { threshold: [0, 0.2, 0.5] });

    this.io.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }
}
