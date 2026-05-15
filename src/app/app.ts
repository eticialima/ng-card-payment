import { Component, signal, ViewChild } from '@angular/core';
import { PaymentCard } from './components/payment-card/payment-card';
import { PaymentMethodSelectorComponent } from './components/payment-method-selector/payment-method-selector';
import { PaymentPix } from './components/payment-pix/payment-pix';
import { StatusPayment, PaymentStatus } from './components/status-payment/status-payment';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Logger } from '@app/utils/logger';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    PaymentCard,
    PaymentMethodSelectorComponent,
    PaymentPix,
    StatusPayment,
    MatStepperModule,
    MatButtonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild('stepper') stepper!: MatStepper;

  protected selectedPaymentMethod = signal<'credit_card' | 'debit_card' | 'pix' | null>(null);
  protected paymentStatus = signal<PaymentStatus>('processing');
  protected paymentMessage = signal<string>('Processando pagamento...');
  protected paymentDetails = signal<string | undefined>(undefined);
  protected transactionId = signal<string | undefined>(undefined);
  protected showingStatus = signal<boolean>(false);

  onMethodSelected(method: string): void {
    this.selectedPaymentMethod.set(method as 'credit_card' | 'debit_card' | 'pix');
    // Avançar automaticamente para o próximo passo
    setTimeout(() => this.stepper?.next(), 100);
  }

  canProceed(): boolean {
    return this.selectedPaymentMethod() !== null;
  }

  onBack(): void {
    this.stepper?.previous();
  }

  onPaymentSubmit(): void {
    Logger.log('💳 Processando pagamento...', {
      method: this.selectedPaymentMethod()
    });

    // Mostrar status de processamento
    this.paymentStatus.set('processing');
    this.paymentMessage.set('Processando pagamento...');
    this.paymentDetails.set(undefined);
    this.transactionId.set(undefined);
    this.showingStatus.set(true);

    // Avançar para o passo de status
    setTimeout(() => this.stepper?.next(), 100);

    // Simular processamento (apenas em desenvolvimento)
    if (!environment.production) {
      this.simulatePaymentProcessing();
    }
  }

  private simulatePaymentProcessing(): void {
    // Simular tempo de processamento (2-3 segundos)
    const processingTime = 2000 + Math.random() * 1000;

    setTimeout(() => {
      // 90% de chance de sucesso em testes
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        const txId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        this.paymentStatus.set('success');
        this.paymentMessage.set('Seu pagamento foi aprovado com sucesso!');
        this.paymentDetails.set('O comprovante foi enviado para o seu e-mail.');
        this.transactionId.set(txId);

        Logger.log('✅ Pagamento aprovado!', { transactionId: txId });
      } else {
        this.paymentStatus.set('failed');
        this.paymentMessage.set('Não foi possível processar seu pagamento.');
        this.paymentDetails.set('Verifique os dados do cartão e tente novamente.');

        Logger.warn('❌ Pagamento recusado');
      }
    }, processingTime);
  }

  onPaymentRetry(): void {
    Logger.log('🔄 Retentativa de pagamento');
    this.showingStatus.set(false);
    this.stepper?.previous();
  }

  onPaymentClose(): void {
    Logger.log('✅ Pagamento concluído');
    // Resetar estado
    this.selectedPaymentMethod.set(null);
    this.showingStatus.set(false);
    this.stepper?.reset();
  }

  onNewPayment(): void {
    Logger.log('🆕 Novo pagamento');
    this.selectedPaymentMethod.set(null);
    this.showingStatus.set(false);
    this.stepper?.reset();
  }
}
