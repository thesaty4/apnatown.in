declare const txContextBrand: unique symbol;

/** Opaque transaction handle; only shared persistence can create or unwrap it. */
export type TxContext = { readonly [txContextBrand]: never };

export interface UnitOfWork {
  run<T>(work: (tx: TxContext) => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
