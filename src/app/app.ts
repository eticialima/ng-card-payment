import { Component, signal, ViewChild } from '@angular/core';
import { PaymentCard } from './components/payment-card/payment-card';
import { PaymentMethodSelectorComponent } from './components/payment-method-selector/payment-method-selector';
import { PaymentPix } from './components/payment-pix/payment-pix';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    PaymentCard,
    PaymentMethodSelectorComponent,
    PaymentPix,
    MatStepperModule,
    MatButtonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild('stepper') stepper!: MatStepper;

  protected selectedPaymentMethod = signal<string | null>(null);

  onMethodSelected(method: string): void {
    this.selectedPaymentMethod.set(method);
    // Avançar automaticamente para o próximo passo
    setTimeout(() => this.stepper?.next(), 100);
  }

  canProceed(): boolean {
    return this.selectedPaymentMethod() !== null;
  }

  onBack(): void {
    this.stepper?.previous();
  }
}
