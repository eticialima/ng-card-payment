import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type PaymentStatus = 'processing' | 'success' | 'failed' | 'waiting';

export interface PaymentStatusData {
  status: PaymentStatus;
  message: string;
  details?: string;
  transactionId?: string;
}

@Component({
  selector: 'app-status-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './status-payment.html',
  styleUrls: ['./status-payment.scss']
})
export class StatusPayment {
  @Input() status: PaymentStatus = 'processing';
  @Input() message: string = 'Processando pagamento...';
  @Input() details?: string;
  @Input() transactionId?: string;
  @Input() paymentMethod?: 'pix' | 'credit_card' | 'debit_card';

  @Output() retry = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() newPayment = new EventEmitter<void>();

  getStatusIcon(): string {
    switch (this.status) {
      case 'processing':
        return '';
      case 'success':
        return 'check_circle';
      case 'failed':
        return 'cancel';
      case 'waiting':
        return 'schedule';
      default:
        return 'help';
    }
  }

  getStatusClass(): string {
    return `status-${this.status}`;
  }

  getStatusTitle(): string {
    switch (this.status) {
      case 'processing':
        return 'Processando Pagamento';
      case 'success':
        return 'Pagamento Aprovado!';
      case 'failed':
        return 'Pagamento Recusado';
      case 'waiting':
        return 'Aguardando Pagamento';
      default:
        return 'Status do Pagamento';
    }
  }

  onRetry(): void {
    this.retry.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  onNewPayment(): void {
    this.newPayment.emit();
  }
}
