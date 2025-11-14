import { Component, Input, Output, EventEmitter, Renderer2, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';

export type ConfirmModalVariant = 'delete' | 'update' | 'warning';

export interface ConfirmModalConfig {
  title: string;
  message: string;
  detail?: string;
  variant: ConfirmModalVariant;
  confirmLabel: string;
  cancelLabel: string;
}

const DEFAULT_CONFIG: ConfirmModalConfig = {
  title: 'Are you sure?',
  message: 'This action requires your confirmation.',
  detail: '',
  variant: 'warning',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel'
};

const VARIANT_ICON: Record<ConfirmModalVariant, string> = {
  delete: 'delete_forever',
  update: 'edit',
  warning: 'warning_amber'
};

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="modal-backdrop">
      <div class="modal-card small" [class.variant-delete]="currentConfig.variant === 'delete'" [class.variant-update]="currentConfig.variant === 'update'">
        <button class="modal-close" (click)="closeModal()">&times;</button>
        <div class="modal-content confirm-content">
          <div class="icon-anim" [class.delete]="currentConfig.variant === 'delete'" [class.update]="currentConfig.variant === 'update'" [class.warning]="currentConfig.variant === 'warning'">
            <span class="material-icons">{{ variantIcon }}</span>
          </div>
          <div class="confirm-message">{{ currentConfig.title }}</div>
          <p class="confirm-subtitle">{{ currentConfig.message }}</p>
          <p class="confirm-detail" *ngIf="currentConfig.detail">{{ currentConfig.detail }}</p>
          <div class="confirm-actions">
            <button class="btn-cancel" (click)="closeModal()">{{ currentConfig.cancelLabel }}</button>
            <button class="btn-confirm" (click)="confirmModal()">{{ currentConfig.confirmLabel }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
  visible = false;
  currentConfig: ConfirmModalConfig = { ...DEFAULT_CONFIG };
  @Input() set config(value: Partial<ConfirmModalConfig> | null) {
    if (value) {
      this.currentConfig = { ...this.currentConfig, ...value };
    }
  }
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
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
  confirmModal() {
    this.visible = false;
    this.renderer.removeClass(this.document.body, 'modal-open');
    this.confirm.emit();
  }
  applyConfig(patch: Partial<ConfirmModalConfig>) {
    this.currentConfig = { ...this.currentConfig, ...patch };
  }
  get variantIcon(): string {
    return VARIANT_ICON[this.currentConfig.variant];
  }
}
