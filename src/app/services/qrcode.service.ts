import { Injectable } from '@angular/core';

export interface PixQRCodeData {
  qrCode: string;
  qrCodeBase64: string;
  expirationTime: number;
  paymentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class QRCodeService {

  constructor() { }

  generateQRCode(data: string): Promise<string> {
    return new Promise((resolve) => {
      // Simulando geração de QR code
      // Em produção, usar uma lib como qrcode.js
      setTimeout(() => {
        resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
      }, 500);
    });
  }


  /**
   * Valida se o código PIX está no formato correto
   */

  parseQRCode(url: string): any {
    try {
      const params = new URL(url).searchParams;
      return {
        recipient: params.get('recipient'),
        amount: params.get('amount'),
        description: params.get('description')
      };
    } catch (error) {
      return null;
    }
  }

  formatExpirationTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    }

    return `${hours} hora${hours !== 1 ? 's' : ''} e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
  }

  generatePixQRCode(amount: number, recipient: string, description?: string): Promise<string> {
    return new Promise((resolve) => {
      // Simulando geração de QR code PIX
      const pixData = {
        version: '01',
        amount: amount.toFixed(2),
        recipient,
        description: description || 'Pagamento via PIX',
        timestamp: new Date().toISOString()
      };

      setTimeout(() => {
        // Em produção, gerar QR code real usando uma biblioteca
        const base64QR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        resolve(base64QR);
      }, 500);
    });
  }

  validatePixKey(key: string, type: 'cpf' | 'email' | 'phone' | 'random'): boolean {
    switch (type) {
      case 'cpf':
        return /^\d{11}$/.test(key.replace(/\D/g, ''));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
      case 'phone':
        return /^\d{10,11}$/.test(key.replace(/\D/g, ''));
      case 'random':
        return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key);
      default:
        return false;
    }
  }


  /**
   * Formata o código PIX para exibição
   */
  formatPixCode(code: string): string {
    // Quebra o código em linhas de 50 caracteres para facilitar leitura
    const chunkSize = 50;
    const chunks: string[] = [];

    for (let i = 0; i < code.length; i += chunkSize) {
      chunks.push(code.substring(i, i + chunkSize));
    }

    return chunks.join('\n');
  }

  /**
   * Copia o código PIX para a área de transferência
   */
  async copyToClipboard(code: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(code);
      return true;
    } catch (err) {
      console.error('Erro ao copiar código PIX:', err);
      return false;
    }
  }

  /**
   * Gera um ID único para o pagamento PIX
   */
  generatePaymentId(): string {
    return `PIX-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Calcula o tempo de expiração padrão (15 minutos)
   */
  getDefaultExpirationTime(): number {
    return 15 * 60; // 15 minutos em segundos
  } 
}
