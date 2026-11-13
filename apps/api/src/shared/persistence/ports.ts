import type { JsonValue } from '@apnatown/shared';

declare const txContextBrand: unique symbol;

/** Opaque transaction handle; only shared persistence can create or unwrap it. */
export type TxContext = { readonly [txContextBrand]: never };

export interface UnitOfWork {
  run<T>(work: (tx: TxContext) => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');

export interface CommandActor {
  readonly kind: 'user' | 'consumer';
  readonly id: string;
}

export interface CommandContext {
  readonly actor: CommandActor;
  readonly operation: string;
  readonly keyHash: Uint8Array;
  readonly requestHash: Uint8Array;
  readonly correlationId: string;
  readonly successStatus: number;
  readonly expiresAt: Date;
}

export interface IdempotencyResultPolicy<T extends JsonValue> {
  store(result: T): JsonValue;
  replay(tx: TxContext, stored: JsonValue, command: CommandContext): Promise<T>;
  httpStatus?(result: T): number;
}

export interface CommandUnitOfWork {
  run<T extends JsonValue>(
    command: CommandContext,
    work: (tx: TxContext) => Promise<T>,
    resultPolicy: IdempotencyResultPolicy<T>,
  ): Promise<T>;
}

export const COMMAND_UNIT_OF_WORK = Symbol('COMMAND_UNIT_OF_WORK');
