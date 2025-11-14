import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="modal-backdrop">
      <div class="modal-card small">
        <button class="modal-close" (click)="closeModal()">&times;</button>
        <div class="modal-content confirm-content">
          <div class="icon-anim">
            <span *ngIf="icon === 'delete'" class="material-icons delete">delete_forever</span>
            <span *ngIf="icon === 'update'" class="material-icons update">edit</span>
            <span *ngIf="icon === 'warning'" class="material-icons warning">warning_amber</span>
          </div>
          <div class="confirm-message">{{ message }}</div>
          <div class="confirm-actions">
            <button class="btn-cancel" (click)="closeModal()">Close</button>
            <button class="btn-confirm" (click)="confirmModal()">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
  visible = false;
  @Input() message: string = 'Are you sure?';
  @Input() icon: 'delete' | 'update' | 'warning' = 'warning';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
  open() { this.visible = true; }
  closeModal() { this.visible = false; this.close.emit(); }
  confirmModal() { this.visible = false; this.confirm.emit(); }
}
