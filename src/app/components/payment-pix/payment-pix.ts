import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QRCodeService } from '@app/services/qrcode.service';
import { environment } from '@environments/environment';
import { Logger } from '@app/utils/logger';

export interface PixData {
  qrCode: string;
  qrCodeBase64: string;
  paymentId: string;
  expirationTime: number;
}

@Component({
  selector: 'app-payment-pix',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './payment-pix.html',
  styleUrls: ['./payment-pix.scss']
})
export class PaymentPix implements OnInit, OnDestroy {
  @Input() pedidoValor: number = 0;

  @Input() disabled: boolean = false;

  @Input() pixData: PixData | null = null;

  @Output() generatePix = new EventEmitter<void>();
  @Output() pixExpired = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() pixPaid = new EventEmitter<void>();

  pixQrCode: string = '';
  pixQrCodeBase64: string = '';
  pixPaymentId: string = '';
  pixExpirationTime: number = 0;
  pixGenerated: boolean = false;
  loading: boolean = false;

  private countdownInterval: any;

  constructor(
    private qrcodeService: QRCodeService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Se receber dados PIX do pai, atualizar
    if (this.pixData) {
      this.updatePixData(this.pixData);
    } else {
      // Gerar PIX automaticamente ao carregar
      this.generatePixAutomatically();
    }
  }

  /**
   * Gera PIX automaticamente
   */
  private generatePixAutomatically(): void {
    this.loading = true;

    // Simular geração de PIX
    setTimeout(() => {
      const mockPixCode = '00020126580014br.gov.bcb.pix01364229a34f-6a11-4b9d-8f4e-d97b8e3a2c1052040000530398654040.015802BR5913Nome Empresa6009SAO PAULO62070503***63041234';
      const mockPixId = this.qrcodeService.generatePaymentId();

      this.pixQrCode = mockPixCode;
      this.pixPaymentId = mockPixId;
      this.pixExpirationTime = this.qrcodeService.getDefaultExpirationTime();
      this.pixGenerated = true;
      this.loading = false;

      // Forçar detecção de mudanças
      this.cdr.detectChanges();

      this.startCountdown();

      Logger.log('✅ PIX gerado automaticamente', {
        paymentId: mockPixId,
        expirationSeconds: this.pixExpirationTime,
        formattedTime: this.getFormattedTime()
      });
    }, 1500);
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  /**
   * Atualiza os dados do PIX recebidos do componente pai
   */
  updatePixData(data: PixData): void {
    Logger.log('📱 updatePixData chamado:', data);
    this.pixQrCode = data.qrCode;
    this.pixQrCodeBase64 = data.qrCodeBase64;
    this.pixPaymentId = data.paymentId;
    this.pixExpirationTime = data.expirationTime;
    this.pixGenerated = true;
    this.loading = false;  // ✅ Parar loading

    Logger.log('✅ PIX gerado:', {
      qrCode: this.pixQrCode ? 'SIM' : 'NÃO',
      qrCodeBase64: this.pixQrCodeBase64 ? 'SIM' : 'NÃO',
      pixGenerated: this.pixGenerated
    });

    // Iniciar countdown
    this.startCountdown();
  }

  /**
   * Emite evento para gerar PIX (processamento no componente pai)
   */
  onGeneratePix(): void {
    this.loading = true;
    this.generatePix.emit();
  }

  /**
   * Copia o código PIX para área de transferência
   */
  async copyPixCode(): Promise<void> {
    try {
      // Tentar copiar usando a API moderna
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(this.pixQrCode);
        this.snackBar.open('Código PIX copiado!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      } else {
        // Fallback para navegadores antigos
        const textArea = document.createElement('textarea');
        textArea.value = this.pixQrCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
          document.execCommand('copy');
          this.snackBar.open('Código PIX copiado!', 'Fechar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        } catch (err) {
          Logger.error('Erro ao copiar:', err);
          this.snackBar.open('Erro ao copiar código', 'Fechar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      Logger.error('Erro ao copiar código PIX:', error);
      this.snackBar.open('Erro ao copiar código', 'Fechar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  /**
   * Inicia countdown de expiração
   */
  private startCountdown(): void {
    this.stopCountdown(); // Limpar qualquer countdown anterior

    this.countdownInterval = setInterval(() => {
      this.pixExpirationTime--;

      if (this.pixExpirationTime <= 0) {
        this.stopCountdown();
        this.pixGenerated = false;
        this.pixQrCode = '';
        this.pixQrCodeBase64 = '';
        this.pixExpired.emit();
      }
    }, 1000);
  }

  /**
   * Para o countdown
   */
  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Formata o tempo de expiração para exibição
   */
  getFormattedTime(): string {
    const minutes = Math.ceil(this.pixExpirationTime / 60);
    const seconds = this.pixExpirationTime % 60;

    if (minutes > 0) {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `00:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Gerar URL do QR Code usando a API do QR Server
   */
  getQrCodeUrl(): string {
    if (!this.pixQrCode) {
      return '';
    }
    const size = '200x200';
    const encodedData = encodeURIComponent(this.pixQrCode);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodedData}`;
  }

  /**
   * Reseta o estado do componente
   */
  reset(): void {
    this.stopCountdown();
    this.pixQrCode = '';
    this.pixQrCodeBase64 = '';
    this.pixPaymentId = '';
    this.pixExpirationTime = 0;
    this.pixGenerated = false;
    this.loading = false;
  }

  /**
   * Verifica se está em ambiente de produção
   * @returns true se produção, false se desenvolvimento
   */
  isProduction(): boolean {
    return environment.production;
  }

  /**
   * ⚠️ APENAS DESENVOLVIMENTO - Simula aprovação do pagamento PIX
   * Usado para testar o fluxo sem precisar fazer pagamento real
   */
  simulatePixApproval(): void {
    if (environment.production) {
      Logger.warn('Simulação não disponível em produção');
      return;
    }

    Logger.log('🧪 TESTE: Simulando aprovação do PIX');

    this.snackBar.open('🧪 TESTE: Pagamento PIX aprovado!', 'Fechar', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-success']
    });

    // Parar countdown e limpar PIX
    this.stopCountdown();
    this.pixGenerated = false;

    // Emitir evento para o componente pai processar o pagamento
    setTimeout(() => {
      this.pixPaid.emit();
    }, 1000);
  }

  /**
   * Método para voltar ao passo anterior
   */
  onBack(): void {
    this.back.emit();
  }
}
