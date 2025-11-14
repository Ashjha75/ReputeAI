import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feature-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop">
      <div class="modal-card">
        <button class="modal-close" (click)="close.emit()">&times;</button>
        <div class="modal-content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./feature-modal.component.css']
})
export class FeatureModalComponent {
  @Output() close = new EventEmitter<void>();
}
