import { createZodDto } from 'nestjs-zod';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  ChallengeInputSchema,
  ChallengeSchema,
  CsrfSchema,
  DemoSessionInputSchema,
  VerifyInputSchema,
  SessionSchema,
  LogoutSchema,
} from '@apnatown/shared/auth';

export class ChallengeInputDto extends createZodDto(ChallengeInputSchema) {}
export class DemoSessionInputDto extends createZodDto(DemoSessionInputSchema) {}
export class VerifyInputDto extends createZodDto(VerifyInputSchema) {}
export class ChallengeDto extends createZodDto(ChallengeSchema) {}
export class CsrfDto extends createZodDto(CsrfSchema) {}
export class SessionDto extends createZodDto(SessionSchema) {}
export class LogoutDto extends createZodDto(LogoutSchema) {}
export class EmptyDto extends createZodDto(EmptyRequestSchema) {}
