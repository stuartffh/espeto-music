/**
 * Value Object: Money
 *
 * Representa valores monetários com validação e operações
 */

class Money {
  constructor(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Valor monetário deve ser um número');
    }
    if (amount < 0) {
      throw new Error('Valor monetário não pode ser negativo');
    }

    this._amount = Math.round(amount * 100) / 100; // 2 casas decimais
    Object.freeze(this);
  }

  get amount() {
    return this._amount;
  }

  add(other) {
    if (!(other instanceof Money)) {
      throw new Error('Pode adicionar apenas Money com Money');
    }
    return new Money(this._amount + other._amount);
  }

  subtract(other) {
    if (!(other instanceof Money)) {
      throw new Error('Pode subtrair apenas Money de Money');
    }
    return new Money(this._amount - other._amount);
  }

  multiply(factor) {
    if (typeof factor !== 'number' || isNaN(factor)) {
      throw new Error('Fator deve ser um número');
    }
    return new Money(this._amount * factor);
  }

  isGreaterThan(other) {
    if (!(other instanceof Money)) {
      throw new Error('Pode comparar apenas Money com Money');
    }
    return this._amount > other._amount;
  }

  isLessThan(other) {
    if (!(other instanceof Money)) {
      throw new Error('Pode comparar apenas Money com Money');
    }
    return this._amount < other._amount;
  }

  equals(other) {
    if (!(other instanceof Money)) {
      return false;
    }
    return this._amount === other._amount;
  }

  toString() {
    return `R$ ${this._amount.toFixed(2)}`;
  }

  toJSON() {
    return this._amount;
  }

  static zero() {
    return new Money(0);
  }

  static fromCents(cents) {
    return new Money(cents / 100);
  }
}

module.exports = Money;
