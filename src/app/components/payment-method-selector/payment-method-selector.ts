import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface PaymentMethod {
  value: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  details?: string;
}

@Component({
  selector: 'app-payment-method-selector',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './payment-method-selector.html',
  styleUrls: ['./payment-method-selector.scss']
})
export class PaymentMethodSelectorComponent {
  @Input() selectedMethod: string | null = null;
  @Input() hasError: boolean = false;
  @Input() touched: boolean = false;
  @Output() methodSelected = new EventEmitter<string>();

  paymentMethods: PaymentMethod[] = [
    {
      value: 'pix',
      icon: 'pix',
      title: 'PIX',
      description: 'Pagamento instantâneo',
      details: 'Aprovação imediata'
    },
    {
      value: 'debit_card',
      icon: 'payment',
      title: 'Cartão de Débito',
      description: 'Débito em conta',
      details: 'Pagamento único à vista'
    },
    {
      value: 'credit_card',
      icon: 'credit_card',
      title: 'Cartão de Crédito',
      description: 'Pague em até 12x',
      badge: 'Parcelável',
      details: 'Parcele sua compra'
    }
  ];

  selectMethod(method: string): void {
    this.methodSelected.emit(method);
  }

  isSelected(method: string): boolean {
    return this.selectedMethod === method;
  }
}
