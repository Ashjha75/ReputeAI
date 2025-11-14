import { Component, EventEmitter, Output, Renderer2, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-feature-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="modal-backdrop">
      <div class="modal-card">
        <button class="modal-close" (click)="closeModal()">&times;</button>
        <div class="modal-content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./feature-modal.component.css']
})
export class FeatureModalComponent {
  visible = false;
  @Output() close = new EventEmitter<void>();
  constructor(@Inject(DOCUMENT) private document: Document, private renderer: Renderer2) {}
  open() {
    this.visible = true;
    this.renderer.addClass(this.document.body, 'modal-open');
  }
  closeModal() {
    this.visible = false;
    this.renderer.removeClass(this.document.body, 'modal-open');
    this.close.emit();
  }
}
