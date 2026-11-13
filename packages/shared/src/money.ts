const MAX_PAISE = BigInt(Number.MAX_SAFE_INTEGER);

function exactInteger(value: number | bigint): bigint {
  if (typeof value === 'bigint') return value;
  if (!Number.isSafeInteger(value))
    throw new RangeError('MONEY_INVALID_INTEGER');
  return BigInt(value);
}

export class Money {
  private constructor(private readonly paise: bigint) {}

  static fromPaise(value: number | bigint): Money {
    return new Money(exactInteger(value));
  }

  add(other: Money): Money {
    return new Money(this.paise + other.paise);
  }

  subtract(other: Money): Money {
    return new Money(this.paise - other.paise);
  }

  multiply(quantity: number | bigint): Money {
    return new Money(this.paise * exactInteger(quantity));
  }

  toPaiseNumber(): number {
    if (this.paise < -MAX_PAISE || this.paise > MAX_PAISE)
      throw new RangeError('MONEY_WIRE_RANGE_EXCEEDED');
    return Number(this.paise);
  }
}
