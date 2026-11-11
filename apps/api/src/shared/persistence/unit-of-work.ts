import type { UnitOfWork, TxContext } from './ports';
import { PrismaDatabase } from './prisma-database';

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly database: PrismaDatabase) {}

  async run<T>(work: (tx: TxContext) => Promise<T>): Promise<T> {
    await this.database.connect();
    return this.database.transaction(work);
  }
}
