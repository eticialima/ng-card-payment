# Payment Card Component

Componente Angular moderno e responsivo para processamento de pagamentos com cartão de crédito/débito e PIX.

## Funcionalidades

- **Cartão de Crédito/Débito** com preview 3D flip
- **Parcelamento** com cálculo automático de juros (Tabela Price)
- **PIX** com QR Code e countdown de expiração
- **Validação** em tempo real de dados do cartão
- **Design responsivo** com Angular Material
- **Modo teste** com dados de cartão simulados
- **Status de pagamento** com animações suaves
- **Stepper** com navegação automática

## Tecnologias

- Angular 21.2.0
- Angular Material
- TypeScript 5.9.2
- SCSS com variáveis globais
- Signals para gerenciamento de estado

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm start
```

Acesse `http://localhost:4200/`

## Build

```bash
npm run build
```

## Estrutura

```
src/app/
├── components/
│   ├── payment-card/          # Formulário de cartão
│   ├── payment-pix/           # Pagamento PIX
│   ├── payment-method-selector/ # Seleção de método
│   └── status-payment/        # Status do pagamento
├── services/
│   ├── payment.service.ts     # Validação de cartão
│   └── qrcode.service.ts      # Geração de QR Code
└── constants/
    └── test-cards.constants.ts # Cartões de teste
```

## Componentes

### Payment Card
- Validação de número, CVV, data de expiração
- Detecção automática de bandeira
- Preview do cartão com flip 3D
- Cálculo de parcelamento com juros

### Payment PIX
- Geração automática de QR Code
- Countdown de expiração (15 minutos)
- Copiar código PIX
- Simulação de pagamento (desenvolvimento)

### Status Payment
- Estados: processing, success, failed, waiting
- Animações de transição
- ID da transação
- Ações contextuais

## Modo Teste

Botão "Preencher Dados de Teste" disponível em desenvolvimento para facilitar testes com cartões válidos da Cielo.

---

**Desenvolvido por Leticia Lima**
