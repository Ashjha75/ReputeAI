import { Component, AfterViewInit, ElementRef, HostBinding, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pixel-drop-promo',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './pixel-drop-promo.component.html',
  styleUrls: ['./pixel-drop-promo.component.css']
})
export class PixelDropPromoComponent implements AfterViewInit, OnDestroy {
  @HostBinding('class.in-view') inView = false;

  private io?: IntersectionObserver;

  constructor(private host: ElementRef<HTMLElement>) {}

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
