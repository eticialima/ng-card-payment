import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService, CardData } from '@app/services/payment.service';
import { getRandomTestCard, type TestCard } from '@app/constants/test-cards.constants';
// import { cpfValidator, cardNumberValidator, expirationDateValidator, cvvValidator } from '@app/utils/validators';
import { environment } from '@environments/environment';
import { Logger } from '@app/utils/logger';

@Component({
  selector: 'app-payment-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './payment-card.html',
  styleUrls: ['./payment-card.scss']
})
export class PaymentCard implements OnInit, OnChanges {
  @Input() disabled: boolean = false;

  @Input() isDebit: boolean = false; // ✅ NOVO: Modo débito

  @Input() savedCardData: CardData | null = null;

  @Output() cardDataChanged = new EventEmitter<CardData>();

  @Output() validationChanged = new EventEmitter<boolean>();

  @Output() submit = new EventEmitter<void>();

  @Output() back = new EventEmitter<void>();

  @Output() installmentValueChanged = new EventEmitter<number>(); // Emite o valor com juros

  @Output() installmentChanged = new EventEmitter<{installments: number, valuePerInstallment: number}>(); // Emite info das parcelas

  cardForm!: FormGroup;

  cardBrand: string = 'Unknown';

  cvvFocused: boolean = false;

  // Parcelamento
  @Input() totalValue: number = 0; // Valor total do pedido
  @Input() produtos: any[] = []; // Lista de produtos para calcular parcelamento
  @Input() maxParcelasLink: number | null = null; // Limite de parcelas do CheckoutLink

  installmentOptions: { parcelas: number; valor: number; total: number; semJuros: boolean }[] = [];

  selectedInstallment: string = '1x';

  calculatedValue: number = 0;

  // Meses e anos para o formulário
  months: string[] = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  years: string[] = [];

  constructor(private fb: FormBuilder, private paymentService: PaymentService) {
    // Gerar anos para o select (atual + 15 anos)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 15; i++) {
      this.years.push((currentYear + i).toString());
    }

  }

  ngOnInit(): void {
    this.cardForm = this.createForm();
    this.watchCardNumber();
    this.watchFormChanges();
    this.updateDisabledState();

    // ✅ Se for débito, forçar 1x
    if (this.isDebit) {
      this.selectedInstallment = '1x';
    }

    // Calcular valor inicial de forma assíncrona para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.calculateInstallmentValue();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && this.cardForm) {
      this.updateDisabledState();
    }

    // ✅ Se mudou para débito, forçar 1x
    if (changes['isDebit'] && this.cardForm && this.isDebit) {
      this.selectedInstallment = '1x';
      setTimeout(() => {
        this.calculateInstallmentValue();
      }, 0);
    }

    // Se o totalValue, produtos ou maxParcelasLink mudaram, recalcular
    if (changes['totalValue'] || changes['produtos'] || changes['maxParcelasLink']) {
      if (!changes['totalValue']?.firstChange || !changes['produtos']?.firstChange || !changes['maxParcelasLink']?.firstChange) {
        setTimeout(() => {
          this.calculateInstallmentValue();
        }, 0);
      }
    }

    // Se recebeu dados salvos, preencher o formulário
    if (changes['savedCardData'] && this.cardForm && this.savedCardData) {
      const previousValue = changes['savedCardData'].previousValue;
      const currentValue = changes['savedCardData'].currentValue;

      // Só preencher se realmente mudou para um valor válido
      if (!previousValue && currentValue) {
        Logger.log('📥 ngOnChanges: Dados salvos recebidos pela primeira vez');
        this.fillFormWithSavedData(this.savedCardData);
      }
    }

  }

  private updateDisabledState(): void {
    if (this.disabled) {
      this.cardForm.disable();
    } else {
      this.cardForm.enable();
    }
  }

  /**
   * Validador customizado para número de cartão
   * Remove espaços antes de validar o tamanho
   */
  private cardNumberValidator(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null;
    }

    const cleanValue = control.value.replace(/\s/g, '');

    if (cleanValue.length < 13 || cleanValue.length > 19) {
      return { 'invalidCardNumber': true };
    }

    return null;
  }


  createForm(): FormGroup {
    const currentYear = new Date().getFullYear();
    return this.fb.group({
      card_number: ['', [Validators.required, this.cardNumberValidator.bind(this)]],
      cardholder_name: ['', [Validators.required, Validators.minLength(3)]],
      expiration_month: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])$/)]],
      expiration_year: ['', [Validators.required, Validators.pattern(/^\d{4}$/), this.yearValidator.bind(this)]],
      security_code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]]
    });
  }

  private yearValidator(control: any): { [key: string]: any } | null {
    const currentYear = new Date().getFullYear();
    const year = parseInt(control.value);
    if (isNaN(year) || year < currentYear || year > currentYear + 20) {
      return { 'invalidYear': true };
    }
    return null;
  }

  formatMonth(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove não-dígitos

    // Limita a 2 dígitos
    if (value.length > 2) {
      value = value.slice(0, 2);
    }

    // Auto-completa 0 se digitar 1-9
    if (value.length === 1 && parseInt(value) > 1) {
      value = '0' + value;
    }

    // Limita a 12
    if (parseInt(value) > 12) {
      value = '12';
    }

    input.value = value;
    this.cardForm.patchValue({ expiration_month: value }, { emitEvent: false });
  }

  formatYear(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove não-dígitos

    // Limita a 4 dígitos
    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    input.value = value;
    this.cardForm.patchValue({ expiration_year: value }, { emitEvent: false });
  }


  watchCardNumber(): void {
    this.cardForm.get('card_number')?.valueChanges.subscribe((value: string) => {
      if (value && value.length >= 6) {
        const cleanValue = value.replace(/\s/g, '');
        this.cardBrand = this.paymentService.detectCardBrand(cleanValue);
      } else {
        this.cardBrand = 'Unknown';
      }
    });
  }

  watchFormChanges(): void {
    this.cardForm.statusChanges.subscribe(() => {
      this.validationChanged.emit(this.cardForm.valid);
      if (this.cardForm.valid) {
        this.emitCardData();
      }
    });
  }

  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 16) {
      value = value.substr(0, 16);
    }

    // Formatar com espaços a cada 4 dígitos
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }

    this.cardForm.get('card_number')?.setValue(formattedValue, { emitEvent: false });
  }

  formatCardholderName(event: any): void {
    let value = event.target.value.toUpperCase();
    this.cardForm.get('cardholder_name')?.setValue(value, { emitEvent: false });
  }

  onCvvFocus(): void {
    this.cvvFocused = true;
  }

  onCvvBlur(): void {
    this.cvvFocused = false;
  }

  getCardData(): CardData {
    const formValues = this.cardForm.value;

    // Converter ano para 2 dígitos (se vier 2030, pega 30; se vier 30, mantém 30)
    const year = formValues.expiration_year.toString();
    const yearTwoDigits = year.length > 2 ? year.substring(2) : year;

    // Pegar número de parcelas selecionado
    const installmentNumber = parseInt(this.selectedInstallment.replace('x', ''));

    // Arredondar valor com juros para 2 casas decimais (BACKEND ESPERA EM REAIS)
    const valorComJurosReais = Math.round(this.calculatedValue * 100) / 100;

    Logger.log(`🔍 getCardData() - selectedInstallment: ${this.selectedInstallment}, installmentNumber: ${installmentNumber}, calculatedValue: ${this.calculatedValue}, valorComJurosReais: ${valorComJurosReais}`);

    return {
      card_number: formValues.card_number.replace(/\s/g, ''),
      cardholder_name: formValues.cardholder_name,
      expiration_month: formValues.expiration_month,
      expiration_year: yearTwoDigits,
      security_code: formValues.security_code,
      brand: this.cardBrand.toLowerCase(),
      installments: isNaN(installmentNumber) ? 1 : installmentNumber,
      interest: 'ByMerchant',  // Juros por conta do lojista
      valor_com_juros: valorComJurosReais  // EM REAIS - backend multiplica por 100
    };
  }

  private emitCardData(): void {
    this.cardDataChanged.emit(this.getCardData());
  }

  // Método público para validação
  isValid(): boolean {
    return this.cardForm.valid;
  }

  // Método para submit
  onSubmit(): void {
    if (this.cardForm.valid && !this.disabled) {
      this.submit.emit();
    }
  }

  // Método para voltar
  onBack(): void {
    this.clearForm();
    this.back.emit();
  }

  /**
   * Preenche o formulário com dados salvos (para retry)
   * @param data Dados do cartão salvos anteriormente
   */
  private fillFormWithSavedData(data: CardData): void {
    Logger.log('💳 Preenchendo formulário com dados salvos');

    // Formatar número do cartão com espaços
    const cleanNumber = data.card_number.replace(/\s/g, '');
    let formattedNumber = '';
    for (let i = 0; i < cleanNumber.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedNumber += ' ';
      }
      formattedNumber += cleanNumber[i];
    }

    // Converter ano para 4 dígitos (se vier 30, converte para 2030)
    const year = data.expiration_year.toString();
    const yearFourDigits = year.length === 2 ? '20' + year : year;

    this.cardForm.patchValue({
      card_number: formattedNumber,
      cardholder_name: data.cardholder_name,
      expiration_month: data.expiration_month,
      expiration_year: yearFourDigits,
      security_code: data.security_code
    }, { emitEvent: false }); // ✅ Não emitir eventos durante preenchimento

    // Atualizar bandeira do cartão
    this.cardBrand = this.paymentService.detectCardBrand(cleanNumber);

    // ✅ Emitir dados apenas UMA VEZ após preencher tudo
    this.validationChanged.emit(this.cardForm.valid);
    if (this.cardForm.valid) {
      this.emitCardData();
    }
  }

  /**
   * Método público para restaurar dados salvos (chamado pelo componente pai)
   * Usado no retry quando savedCardData já estava definido
   */
  public restoreSavedData(): void {
    if (this.savedCardData) {
      Logger.log('🔄 Restaurando dados salvos do cartão (chamada pública)');
      this.fillFormWithSavedData(this.savedCardData);
    } else {
      Logger.warn('⚠️ Nenhum dado salvo para restaurar');
    }
  }

  /**
   * Método público para limpar formulário
   * Usado quando usuário volta e muda de método de pagamento
   */
  public clearForm(): void {
    Logger.log('🗑️ Limpando formulário de cartão');
    this.cardForm.reset();
    this.cardBrand = 'Unknown';
    // ✅ NÃO mudar savedCardData aqui - é @Input controlado pelo pai
  }

  /**
   * Calcula o valor da prestação usando a fórmula Price
   * @param valor_fin Valor a ser financiado
   * @param n_prest Número de prestações
   * @param juro_mes Taxa de juros mensal (em decimal, ex: 0.027 para 2.7%)
   * @returns Valor da prestação
   */
  private calcPrestacaoPrice(valor_fin: number, n_prest: number, juro_mes: number): number {
    if (n_prest === 1 || juro_mes === 0) return valor_fin;
    return valor_fin * (Math.pow((1 + juro_mes), n_prest) * juro_mes) / (Math.pow((1 + juro_mes), n_prest) - 1);
  }

  /**
   * Calcula as opções de parcelamento baseado nas regras de negócio:
   * - Acessórios: sempre sem juros
   * - Produtos principais: com juros de 2.7% ao mês
   * - Parcela mínima: R$ 150
   * - Respeita max_parcelas dos produtos e do link
   */
  private calcularOpcoes(): void {
    console.log('\n🧮 ================ [calcularOpcoes] INÍCIO ================');
    console.log('   @Input() totalValue:', this.totalValue, '(tipo:', typeof this.totalValue + ')');
    // console.log('   @Input() maxParcelas:', this.maxParcelas);
    console.log('   @Input() maxParcelasLink:', this.maxParcelasLink);
    console.log('   produtos:', this.produtos?.length || 0);

    const TAXA_JUROS_PADRAO = 0.027; // 2.7% ao mês (fallback)
    const PARCELA_MINIMA = 150;
    const ACESSORIO_MAX_PARCELAS_SOLO = 5;

    this.installmentOptions = [];

    // Calcular taxa de juros média dos produtos (do banco de dados)
    let taxaJuros = TAXA_JUROS_PADRAO;
    if (this.produtos && this.produtos.length > 0) {
      const produtosComJuros = this.produtos.filter(item => item.produto?.juros !== undefined);
      if (produtosComJuros.length > 0) {
        const somaJuros = produtosComJuros.reduce((sum, item) => {
          const juros = parseFloat(item.produto.juros || '0');
          return sum + juros;
        }, 0);
        taxaJuros = somaJuros / produtosComJuros.length;
        Logger.log(`📊 Taxa de juros média dos produtos: ${(taxaJuros * 100).toFixed(2)}%`);
      }
    }

    // Determinar limite máximo de parcelas
    let maxParcelasPermitidas = 24;

    // 1. Limite do CheckoutLink tem prioridade absoluta
    if (this.maxParcelasLink && this.maxParcelasLink > 0) {
      maxParcelasPermitidas = this.maxParcelasLink;
      Logger.log(`✅ Usando max_parcelas do link: ${maxParcelasPermitidas}x`);
    }
    // 2. Se não tem limite no link, usar o menor max_parcelas dos produtos
    else if (this.produtos && this.produtos.length > 0) {
      const maxParcelasProdutos = this.produtos
        .map(p => p.produto?.max_parcelas || 24)
        .reduce((min, current) => Math.min(min, current), 24);
      maxParcelasPermitidas = maxParcelasProdutos;
      Logger.log(`✅ Usando max_parcelas dos produtos: ${maxParcelasPermitidas}x`);
    }

    // Separar acessórios de produtos principais
    let valorAcessorios = 0;
    let valorProdutosPrincipais = 0;
    let temAcessorios = false;
    let temProdutos = false;

    if (this.produtos && this.produtos.length > 0) {
      // Calcular valor bruto dos produtos (sem descontos)
      let valorBrutoAcessorios = 0;
      let valorBrutoPrincipais = 0;

      this.produtos.forEach(item => {
        const preco = parseFloat(item.produto?.price || '0');
        const valor = preco * item.quantidade;
        if (item.produto?.is_acessorio) {
          valorBrutoAcessorios += valor;
          temAcessorios = true;
        } else {
          valorBrutoPrincipais += valor;
          temProdutos = true;
        }
      });

      // Calcular valor total bruto
      const valorBrutoTotal = valorBrutoAcessorios + valorBrutoPrincipais;

      // Se tem desconto/ajuste, distribuir proporcionalmente
      if (valorBrutoTotal > 0 && Math.abs(valorBrutoTotal - this.totalValue) > 0.01) {
        // Fator de ajuste: valor real / valor bruto
        const fatorAjuste = this.totalValue / valorBrutoTotal;

        valorAcessorios = valorBrutoAcessorios * fatorAjuste;
        valorProdutosPrincipais = valorBrutoPrincipais * fatorAjuste;

        Logger.log(`🎯 Desconto detectado! Ajustando valores proporcionalmente (fator: ${fatorAjuste.toFixed(4)})`);
      } else {
        // Sem desconto, usar valores brutos
        valorAcessorios = valorBrutoAcessorios;
        valorProdutosPrincipais = valorBrutoPrincipais;
      }

      Logger.log(`💰 Valores - Acessórios: R$ ${valorAcessorios.toFixed(2)}, Produtos: R$ ${valorProdutosPrincipais.toFixed(2)}`);
    } else {
      // Se não tem produtos detalhados, assumir que é tudo produto principal
      valorProdutosPrincipais = this.totalValue;
      temProdutos = true;
    }

    // Se só tem acessórios, limitar a 5x
    if (temAcessorios && !temProdutos) {
      maxParcelasPermitidas = Math.min(maxParcelasPermitidas, ACESSORIO_MAX_PARCELAS_SOLO);
      Logger.log(`🎁 Apenas acessórios: limitado a ${maxParcelasPermitidas}x`);
    }

    // Calcular para cada parcela de 1 até o máximo permitido
    for (let i = 1; i <= maxParcelasPermitidas; i++) {
      let parcelaAcessorios = 0;
      let parcelaProdutos = 0;
      let semJuros = false;

      // 1x sempre sem juros
      if (i === 1) {
        const valorParcela = this.totalValue;
        console.log('🔍 [1x À VISTA]');
        console.log('   this.totalValue:', this.totalValue, typeof this.totalValue);
        console.log('   valorParcela:', valorParcela);

        this.installmentOptions.push({
          parcelas: 1,
          valor: valorParcela,
          total: this.totalValue,
          semJuros: true
        });
        continue;
      }

      // Acessórios: sempre dividido sem juros
      if (valorAcessorios > 0) {
        parcelaAcessorios = valorAcessorios / i;
      }

      // Produtos principais: com ou sem juros dependendo da taxa
      if (valorProdutosPrincipais > 0) {
        if (taxaJuros > 0) {
          // Com juros: usar tabela PRICE
          parcelaProdutos = this.calcPrestacaoPrice(valorProdutosPrincipais, i, taxaJuros);
        } else {
          // Sem juros: divisão simples
          parcelaProdutos = valorProdutosPrincipais / i;
        }
      }

      const valorParcela = parcelaAcessorios + parcelaProdutos;
      const valorTotal = Math.round(valorParcela * i * 100) / 100; // Arredondar para 2 casas decimais

      // Validar parcela mínima
      if (valorParcela < PARCELA_MINIMA) {
        Logger.log(`⚠️ ${i}x = R$ ${valorParcela.toFixed(2)} < R$ 150 - descartado`);
        continue;
      }

      // Sem juros se: 100% acessórios OU taxa de juros = 0
      semJuros = valorProdutosPrincipais === 0 || taxaJuros === 0;

      this.installmentOptions.push({
        parcelas: i,
        valor: valorParcela,
        total: valorTotal,
        semJuros
      });
    }

    Logger.log(`📊 Opções de parcelamento calculadas:`, this.installmentOptions);

    // Garantir que pelo menos 1x está disponível
    if (this.installmentOptions.length === 0) {
      this.installmentOptions.push({
        parcelas: 1,
        valor: this.totalValue,
        total: this.totalValue,
        semJuros: true
      });
    }

    // Atualizar parcela selecionada se necessário
    const parcelaAtual = parseInt(this.selectedInstallment.replace('x', ''));
    if (!this.installmentOptions.find(opt => opt.parcelas === parcelaAtual)) {
      this.selectedInstallment = '1x';
      this.updateSelectedInstallment();
    }
  }

  /**
   * Atualiza o valor calculado baseado na parcela selecionada
   */
  private updateSelectedInstallment(): void {
    const parcelas = parseInt(this.selectedInstallment.replace('x', ''));
    const opcao = this.installmentOptions.find(opt => opt.parcelas === parcelas);

    if (opcao) {
      this.calculatedValue = opcao.total;

      // Emitir o valor calculado para o componente pai
      this.installmentValueChanged.emit(this.calculatedValue);

      // Emitir informações das parcelas
      this.installmentChanged.emit({
        installments: opcao.parcelas,
        valuePerInstallment: opcao.valor
      });

      Logger.log(`💳 Parcela selecionada: ${parcelas}x de R$ ${opcao.valor.toFixed(2)} (Total: R$ ${opcao.total.toFixed(2)})`);
    }
  }

  /**
   * Retorna apenas as parcelas a serem exibidas (1-12x + 18x + 24x se disponíveis)
   */
  get parcelasParaMostrar(): { parcelas: number; valor: number; total: number; semJuros: boolean }[] {
    const resultado: { parcelas: number; valor: number; total: number; semJuros: boolean }[] = [];

    // Adicionar de 1x até 12x (se disponíveis)
    for (let i = 1; i <= 12; i++) {
      const opcao = this.installmentOptions.find(opt => opt.parcelas === i);
      if (opcao) resultado.push(opcao);
    }

    // Adicionar 18x se disponível
    const opcao18 = this.installmentOptions.find(opt => opt.parcelas === 18);
    if (opcao18) resultado.push(opcao18);

    // Adicionar 24x se disponível
    const opcao24 = this.installmentOptions.find(opt => opt.parcelas === 24);
    if (opcao24) resultado.push(opcao24);

    return resultado;
  }

  /**
   * Calcula o valor total com base no número de parcelas (MÉTODO ANTIGO - mantido para compatibilidade)
   * @deprecated Use calcularOpcoes() e updateSelectedInstallment() ao invés disso
   */
  private calculateInstallmentValue(): void {
    // Recalcular opções sempre que o valor mudar
    this.calcularOpcoes();
    this.updateSelectedInstallment();
  }

  /**
   * Chamado quando o usuário seleciona uma parcela
   * @param installment Parcela selecionada (ex: '3x')
   */
  public onInstallmentChange(installment: string): void {
    this.selectedInstallment = installment;
    this.updateSelectedInstallment();
  }

  /**
   * Formata o texto de exibição para cada opção de parcela
   */
  public getInstallmentText(opcao: { parcelas: number; valor: number; total: number; semJuros: boolean }): string {
    const { parcelas, valor, total, semJuros } = opcao;

    if (parcelas === 1) {
      return `1x sem juros - R$ ${total.toFixed(2)}`;
    }

    const badge = semJuros ? ' sem juros' : '';
    return `${parcelas}x de R$ ${valor.toFixed(2)}${badge} (Total: R$ ${total.toFixed(2)})`;
  }

  /**
   * Verifica se está em ambiente de produção
   * @returns true se produção, false se desenvolvimento
   */
  isProduction(): boolean {
    return environment.production;
  }

  /**
   * ⚠️ APENAS DESENVOLVIMENTO - Preenche com dados de teste da Cielo
   * Cartão de teste Mastercard Cielo
   *
   * @remarks Este método só funciona em ambiente de desenvolvimento
   */
  preencherDadosTeste(): void {
    // Verificar se está em desenvolvimento
    if (environment.production) {
      Logger.warn('Método de teste não disponível em produção');
      return;
    }

    // 🎲 Escolher cartão aleatório baseado no tipo (débito ou crédito)
    const paymentMethod = this.isDebit ? 'debit_card' : 'credit_card';
    const testCard: TestCard = getRandomTestCard(paymentMethod);

    Logger.log('🎲 Cartão de teste selecionado:', {
      tipo: this.isDebit ? 'DÉBITO' : 'CRÉDITO',
      cartao: testCard.number,
      bandeira: testCard.brand,
      cenario: testCard.scenario,
      resultado: testCard.result
    });

    // Extrair mês e ano da validade (formato: MM/YYYY)
    const [month, year] = testCard.expiration.split('/');

    // Preencher formulário
    this.cardForm.patchValue({
      card_number: testCard.number,
      cardholder_name: testCard.holder,
      expiration_month: month,
      expiration_year: year,
      security_code: testCard.cvv
    });

    // Atualizar bandeira
    this.cardBrand = this.paymentService.detectCardBrand(testCard.number);

    // Emitir mudanças
    this.emitCardData();

    // Log informativo para o usuário
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🎲 CARTÃO DE TESTE PREENCHIDO                                 ║
╠════════════════════════════════════════════════════════════════╣
║  Tipo:      ${this.isDebit ? 'DÉBITO (3DS)' : 'CRÉDITO (Simulado)'.padEnd(49)}║
║  Cartão:    ${testCard.number.padEnd(49)}║
║  Bandeira:  ${testCard.brand.padEnd(49)}║
║  Cenário:   ${testCard.scenario.substring(0, 47).padEnd(49)}║
${testCard.scenario.length > 47 ? '║             ' + testCard.scenario.substring(47).padEnd(49) + '║' : ''}
║  Resultado: ${testCard.result.padEnd(49)}║
╚════════════════════════════════════════════════════════════════╝
${this.isDebit && testCard.scenario.includes('desafio') && testCard.result === 'SUCCESS' ?
'💡 Dica: No popup de autenticação, use o código: 1234' : ''}
    `);
  }
}
