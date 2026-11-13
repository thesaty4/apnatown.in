import {
  RiderApplicationPageSchema,
  RiderApplicationQuerySchema,
  RiderCurrentOfferSchema,
  RiderDecisionResultSchema,
  RiderDecisionSchema,
  RiderDisputeInputSchema,
  RiderDisputeResultSchema,
  RiderDraftWriteSchema,
  RiderEarningsQuerySchema,
  RiderEarningsSchema,
  RiderHistoryPageSchema,
  RiderHistoryQuerySchema,
  RiderHistorySchema,
  RiderJobSchema,
  RiderLocationInputSchema,
  RiderOnlineInputSchema,
  RiderOnlineStateSchema,
  RiderProfileSchema,
  RiderSummarySchema,
} from '@apnatown/shared/delivery';
import { createZodDto } from 'nestjs-zod';
import { sessionBinding, type AuthRequest } from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';
import type { RiderRequest } from '../application/rider-access';

export class RiderDraftWriteDto extends createZodDto(RiderDraftWriteSchema) {}
export class RiderProfileDto extends createZodDto(RiderProfileSchema) {}
export class RiderOnlineInputDto extends createZodDto(RiderOnlineInputSchema) {}
export class RiderOnlineStateDto extends createZodDto(RiderOnlineStateSchema) {}
export class RiderLocationInputDto extends createZodDto(
  RiderLocationInputSchema,
) {}
export class RiderSummaryDto extends createZodDto(RiderSummarySchema) {}
export class RiderCurrentOfferDto extends createZodDto(
  RiderCurrentOfferSchema,
) {}
export class RiderJobDto extends createZodDto(RiderJobSchema) {}
export class RiderHistoryQueryDto extends createZodDto(
  RiderHistoryQuerySchema,
) {}
export class RiderHistoryPageDto extends createZodDto(RiderHistoryPageSchema) {}
export class RiderHistoryDto extends createZodDto(RiderHistorySchema) {}
export class RiderEarningsQueryDto extends createZodDto(
  RiderEarningsQuerySchema,
) {}
export class RiderEarningsDto extends createZodDto(RiderEarningsSchema) {}
export class RiderDisputeInputDto extends createZodDto(
  RiderDisputeInputSchema,
) {}
export class RiderDisputeResultDto extends createZodDto(
  RiderDisputeResultSchema,
) {}
export class RiderApplicationQueryDto extends createZodDto(
  RiderApplicationQuerySchema,
) {}
export class RiderApplicationPageDto extends createZodDto(
  RiderApplicationPageSchema,
) {}
export class RiderDecisionDto extends createZodDto(RiderDecisionSchema) {}
export class RiderDecisionResultDto extends createZodDto(
  RiderDecisionResultSchema,
) {}

/** Own-account rider request; the rider is always the session user. */
export function riderRequest(request: AuthRequest): RiderRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
  };
}

export const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.';
export const KEY =
  'Case-sensitive key; retry the identical command within 24 hours to replay the stored result.';
