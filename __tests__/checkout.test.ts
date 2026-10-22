import { makeCheckoutSchema } from '@/schemas/checkout';

const ORDER_TOTAL = 46.3;

const valid = {
  street: 'Rua das Flores',
  number: '120',
  neighborhood: 'Centro',
  complement: '',
  payment: 'pix' as const,
  changeFor: '',
};

describe('makeCheckoutSchema', () => {
  const schema = makeCheckoutSchema(ORDER_TOTAL);

  const isValid = (data: unknown) => schema.safeParse(data).success;

  const errorsOf = (data: unknown) => {
    const result = schema.safeParse(data);
    return result.success
      ? []
      : result.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`);
  };

  it('aceita um pedido completo', () => {
    expect(isValid(valid)).toBe(true);
  });

  describe('endereço', () => {
    it('exige rua, número e bairro', () => {
      expect(
        errorsOf({ ...valid, street: 'ab', number: '', neighborhood: ' ' }),
      ).toEqual([
        'street: Informe a rua',
        'number: Informe o número',
        'neighborhood: Informe o bairro',
      ]);
    });
  });

  describe('forma de pagamento', () => {
    it('recusa forma de pagamento desconhecida', () => {
      expect(isValid({ ...valid, payment: 'boleto' })).toBe(false);
    });
  });

  describe('troco', () => {
    const cash = { ...valid, payment: 'cash' as const };

    it('só é validado em dinheiro', () => {
      expect(isValid({ ...valid, payment: 'pix', changeFor: '10' })).toBe(true);
    });

    it('recusa troco que não cobre o total do pedido', () => {
      expect(errorsOf({ ...cash, changeFor: '30' })).toEqual([
        'changeFor: O troco deve cobrir o total do pedido',
      ]);
    });

    it('recusa valor não numérico', () => {
      expect(errorsOf({ ...cash, changeFor: 'abc' })).toEqual([
        'changeFor: Valor inválido',
      ]);
    });

    it('aceita valor com vírgula decimal', () => {
      expect(isValid({ ...cash, changeFor: '50,00' })).toBe(true);
    });

    it('aceita troco em branco', () => {
      expect(isValid({ ...cash, changeFor: '' })).toBe(true);
    });
  });
});