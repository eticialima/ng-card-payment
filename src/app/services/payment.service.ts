import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CardData {
  card_number: string;
  cardholder_name: string;
  expiration_month: string;
  expiration_year: string;
  security_code: string;
  brand?: string;
  installments?: number;
  interest?: string;
  valor_com_juros?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private cardDataSubject = new BehaviorSubject<CardData | null>(null);
  cardData$ = this.cardDataSubject.asObservable();

  updateCardData(data: CardData): void {
    this.cardDataSubject.next(data);
  }

  getCardData(): CardData | null {
    return this.cardDataSubject.value;
  }

  validateCard(data: CardData): boolean {
    return (
      data.card_number.length >= 13 &&
      data.cardholder_name.length > 0 &&
      data.expiration_month.length > 0 &&
      data.expiration_year.length > 0 &&
      data.security_code.length >= 3
    );
  }

  detectCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');

    // Visa
    if (/^4/.test(cleaned)) {
      return 'visa';
    }
    // Mastercard
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
      return 'mastercard';
    }
    // American Express
    if (/^3[47]/.test(cleaned)) {
      return 'amex';
    }
    // Discover
    if (/^6(?:011|5)/.test(cleaned)) {
      return 'discover';
    }
    // Diners
    if (/^3(?:0[0-5]|[68])/.test(cleaned)) {
      return 'diners';
    }
    // JCB
    if (/^35/.test(cleaned)) {
      return 'jcb';
    }
    // Elo
    if (/^(4011|431274|438935|451416|457393|4576|457631|457632|504175|627780|636297|636368|636369)/.test(cleaned)) {
      return 'elo';
    }
    // Hipercard
    if (/^(384100|384140|384160|606282|637095|637568)/.test(cleaned)) {
      return 'hipercard';
    }

    return 'unknown';
  }

  processPayment(data: CardData, amount: number): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: 'TXN_' + Date.now(),
          amount,
          cardData: data
        });
      }, 2000);
    });
  }
}
