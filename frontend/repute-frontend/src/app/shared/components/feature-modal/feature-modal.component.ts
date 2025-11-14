import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  open() { this.visible = true; }
  closeModal() { this.visible = false; this.close.emit(); }
}
