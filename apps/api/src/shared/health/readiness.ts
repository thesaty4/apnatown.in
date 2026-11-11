import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../errors/errors';

export const READINESS_REPOSITORY = Symbol('READINESS_REPOSITORY');
export interface ReadinessRepository {
  check(): Promise<boolean>;
  close(): Promise<void>;
}

@Injectable()
export class ReadinessService {
  private stopping = false;
  constructor(
    @Inject(READINESS_REPOSITORY)
    private readonly repository: ReadinessRepository,
  ) {}

  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  async ready(): Promise<{ status: 'ok' }> {
    let available = false;
    try {
      available = !this.stopping && (await this.repository.check());
    } catch {
      /* Dependency errors never expose connection details. */
    }
    // Check again after awaiting: SIGTERM can arrive while a query is in flight.
    if (!available || this.stopping)
      throw new DomainError('COMMON_UNAVAILABLE');
    return { status: 'ok' };
  }

  stop(): void {
    this.stopping = true;
  }
}
