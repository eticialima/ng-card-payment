export interface TestCard {
  number: string;
  holder: string;
  expiry: string;
  expiration: string;
  cvv: string;
  type: 'credit' | 'debit';
  brand: string;
  scenario: string;
  result: string;
}

const testCards: TestCard[] = [
  {
    number: '4111111111111111',
    holder: 'TEST USER',
    expiry: '12/25',
    expiration: '12/25',
    cvv: '123',
    type: 'credit',
    brand: 'visa',
    scenario: 'Cartão de crédito aprovado',
    result: 'SUCCESS'
  },
  {
    number: '5555555555554444',
    holder: 'TEST DEBIT',
    expiry: '06/26',
    expiration: '06/26',
    cvv: '456',
    type: 'debit',
    brand: 'mastercard',
    scenario: 'Cartão de débito com desafio de autenticação',
    result: 'SUCCESS'
  },
  {
    number: '4000000000000002',
    holder: 'TEST DECLINED',
    expiry: '09/27',
    expiration: '09/27',
    cvv: '789',
    type: 'credit',
    brand: 'visa',
    scenario: 'Cartão recusado por falta de saldo',
    result: 'DECLINED'
  },
  {
    number: '5105105105105100',
    holder: 'TEST EXPIRED',
    expiry: '01/23',
    expiration: '01/23',
    cvv: '321',
    type: 'credit',
    brand: 'mastercard',
    scenario: 'Cartão expirado',
    result: 'EXPIRED'
  },
  {
    number: '378282246310005',
    holder: 'TEST AMEX',
    expiry: '03/28',
    expiration: '03/28',
    cvv: '1234',
    type: 'credit',
    brand: 'amex',
    scenario: 'American Express aprovado',
    result: 'SUCCESS'
  }
];

export function getRandomTestCard(paymentMethod?: string): TestCard {
  if (paymentMethod) {
    const filtered = testCards.filter(card => card.type === paymentMethod);
    if (filtered.length > 0) {
      return filtered[Math.floor(Math.random() * filtered.length)];
    }
  }
  return testCards[Math.floor(Math.random() * testCards.length)];
}
