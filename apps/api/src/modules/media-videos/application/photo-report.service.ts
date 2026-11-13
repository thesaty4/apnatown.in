import { Inject, Injectable } from '@nestjs/common';
import {
  CreatePhotoReportSchema,
  VideoReportAcceptedSchema,
  type CreatePhotoReport,
  type JsonValue,
  type VideoReportAccepted,
} from '@apnatown/shared';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import { COMMAND_UNIT_OF_WORK, type CommandUnitOfWork } from '../../../shared/persistence/ports';
import { rateLimitSubjectHash } from '../../../shared/rate-limit/rate-limit';
import { CLOCK, ID_PROVIDER, type Clock, type IdProvider } from '../../../shared/runtime/providers';
import {
  MEDIA_PUBLIC_READ_REPOSITORY,
  type PublicMediaReadRepository,
} from '../domain/media-gallery';
import type { VideoReportRequest } from '../domain/videos';

const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
const parseAccepted = (value: unknown) =>
  VideoReportAcceptedSchema.parse(value) as VideoReportAccepted & JsonValue;

/**
 * Public photo report. The reported asset must be currently public at the
 * claimed placement; one open report per reporter session and photo
 * subject is kept (duplicates acknowledge the existing report ID).
 */
@Injectable()
export class PhotoReportService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY) private readonly contexts: HttpCommandContextFactory,
    @Inject(MEDIA_PUBLIC_READ_REPOSITORY) private readonly reads: PublicMediaReadRepository,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  report(request: VideoReportRequest, assetId: string, input: CreatePhotoReport): Promise<VideoReportAccepted> {
    const body = CreatePhotoReportSchema.parse(input);
    const reporterSubjectHash = rateLimitSubjectHash(
      this.config.CURSOR_SIGNING_KEY,
      `session:${request.session.id}`,
    );
    const command = this.contexts.create(
      { name: 'media.photo.report', method: 'POST', scope: 'principal', successStatus: 202 },
      {
        actorId: request.session.id,
        correlationId: request.correlationId,
        resource: `/media/photos/${assetId}/reports`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify({
          assetId,
          ...body,
          reporterUserId: request.reporterUserId,
          reporterSubjectHash: reporterSubjectHash.toString('hex'),
        })) as JsonValue,
      },
    );
    return this.commands
      .run(
        command,
        async (tx) => {
          const businessId = await this.reads.photoPlacementBusiness(tx, {
            assetId, placementType: body.placementType, placementId: body.placementId,
          });
          if (!businessId) throw new DomainError('MEDIA_NOT_FOUND');
          const reportId = await this.reads.insertPhotoReport(tx, {
            id: this.ids.uuidv7(),
            assetId,
            placementType: body.placementType,
            placementId: body.placementId,
            businessId,
            reporterUserId: request.reporterUserId,
            reporterSubjectHash,
            reason: body.reason,
            details: body.details ?? null,
            createdAt: this.clock.now(),
          });
          return parseAccepted({ reportId });
        },
        { store: (result) => result, replay: (_tx, stored) => Promise.resolve(parseAccepted(stored)) },
      )
      .then(parseAccepted);
  }
}
