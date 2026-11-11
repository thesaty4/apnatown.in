import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from './generated/client';
import type { TxContext } from './ports';

type ActiveTransaction = {
  readonly owner: PrismaDatabase;
  readonly client: Prisma.TransactionClient;
  active: boolean;
  readonly expiresAt: number;
};

export interface PrismaDatabaseOptions {
  readonly connectionString: string;
  readonly maxConnections?: number;
  readonly connectionTimeoutMs?: number;
  readonly transactionMaxWaitMs?: number;
  readonly transactionTimeoutMs?: number;
}

export class PrismaDatabase {
  private readonly clientInstance: PrismaClient;
  private readonly transactions = new WeakMap<object, ActiveTransaction>();
  private connected = false;
  private closed = false;
  private connectPromise: Promise<void> | undefined;
  private disconnectPromise: Promise<void> | undefined;

  constructor(options: PrismaDatabaseOptions) {
    this.validateOptions(options);
    const adapter = new PrismaPg({
      connectionString: options.connectionString,
      max: options.maxConnections ?? 10,
      connectionTimeoutMillis: options.connectionTimeoutMs ?? 2_000,
      statement_timeout: options.transactionTimeoutMs ?? 5_000,
      application_name: 'apnatown-api',
    });
    this.clientInstance = new PrismaClient({ adapter });
    this.transactionOptions = {
      maxWait: options.transactionMaxWaitMs ?? 2_000,
      timeout: options.transactionTimeoutMs ?? 5_000,
    };
  }

  private readonly transactionOptions: {
    readonly maxWait: number;
    readonly timeout: number;
  };

  connect(): Promise<void> {
    if (this.closed) throw new Error('DATABASE_CLOSED');
    if (this.connected) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;
    this.connectPromise = this.clientInstance
      .$connect()
      .then(() => {
        if (!this.closed) this.connected = true;
      })
      .finally(() => {
        this.connectPromise = undefined;
      });
    return this.connectPromise;
  }

  disconnect(): Promise<void> {
    if (this.disconnectPromise) return this.disconnectPromise;
    if (this.closed) return Promise.resolve();
    this.closed = true;
    this.disconnectPromise = (async () => {
      try {
        await this.connectPromise;
      } finally {
        this.connected = false;
        await this.clientInstance.$disconnect();
      }
    })();
    return this.disconnectPromise;
  }

  async transaction<T>(work: (tx: TxContext) => Promise<T>): Promise<T> {
    if (this.closed) throw new Error('DATABASE_CLOSED');
    if (!this.connected) throw new Error('DATABASE_NOT_CONNECTED');
    let activeTransaction: ActiveTransaction | undefined;
    try {
      return await this.clientInstance.$transaction(async (client) => {
        const handle = Object.freeze(Object.create(null)) as TxContext;
        const transaction: ActiveTransaction = {
          owner: this,
          client,
          active: true,
          expiresAt: performance.now() + this.transactionOptions.timeout,
        };
        activeTransaction = transaction;
        this.transactions.set(handle, transaction);
        try {
          return await work(handle);
        } finally {
          transaction.active = false;
        }
      }, this.transactionOptions);
    } finally {
      if (activeTransaction) activeTransaction.active = false;
    }
  }

  queryRaw<T>(query: Prisma.Sql): Promise<T> {
    if (this.closed) throw new Error('DATABASE_CLOSED');
    return this.clientInstance.$queryRaw<T>(query);
  }

  /** Resolve only live handles created by this instance; never fall back to root. */
  client(tx: TxContext): Prisma.TransactionClient {
    if (this.closed) throw new Error('DATABASE_CLOSED');
    if ((typeof tx !== 'object' && typeof tx !== 'function') || tx === null)
      throw new Error('INVALID_TRANSACTION_CONTEXT');
    const transaction = this.transactions.get(tx);
    if (!transaction || transaction.owner !== this)
      throw new Error('FOREIGN_TRANSACTION_CONTEXT');
    if (!transaction.active || performance.now() >= transaction.expiresAt)
      throw new Error('EXPIRED_TRANSACTION_CONTEXT');
    return transaction.client;
  }

  onModuleDestroy(): Promise<void> {
    return this.disconnect();
  }

  private validateOptions(options: PrismaDatabaseOptions): void {
    let url: URL;
    try {
      url = new URL(options.connectionString);
    } catch {
      throw new Error('INVALID_DATABASE_CONFIGURATION');
    }
    if (!['postgres:', 'postgresql:'].includes(url.protocol))
      throw new Error('INVALID_DATABASE_CONFIGURATION');
    this.assertBoundedInteger(options.maxConnections ?? 10, 1, 50);
    this.assertBoundedInteger(
      options.connectionTimeoutMs ?? 2_000,
      100,
      30_000,
    );
    this.assertBoundedInteger(
      options.transactionMaxWaitMs ?? 2_000,
      100,
      30_000,
    );
    this.assertBoundedInteger(
      options.transactionTimeoutMs ?? 5_000,
      100,
      60_000,
    );
  }

  private assertBoundedInteger(value: number, min: number, max: number): void {
    if (!Number.isSafeInteger(value) || value < min || value > max)
      throw new Error('INVALID_DATABASE_CONFIGURATION');
  }
}
