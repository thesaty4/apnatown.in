import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  ProfileSchema,
  PreferencesSchema,
  UpdateProfileSchema,
  UpdatePreferencesSchema,
  type UpdateProfile,
  type UpdatePreferences,
} from '@apnatown/shared/users';
import {
  OwnAccount,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ProfileService } from '../application/profile.service';

class ProfileDto extends createZodDto(ProfileSchema) {}
class PreferencesDto extends createZodDto(PreferencesSchema) {}
class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
class UpdatePreferencesDto extends createZodDto(UpdatePreferencesSchema) {}

@ApiTags('users')
@PrivateApi()
@OwnAccount()
@Controller('users/me')
export class UsersController {
  constructor(private readonly profiles: ProfileService) {}
  @Get()
  @ApiOkResponse({ type: ProfileDto })
  @RateLimit({
    key: 'users.profile.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async profile(@Req() request: AuthRequest) {
    return ProfileSchema.parse(
      await this.profiles.profile(sessionBinding(request)),
    );
  }
  @Patch()
  @BrowserMutation()
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: ProfileDto })
  @RateLimit({
    key: 'users.profile.write',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'principal',
  })
  async updateProfile(
    @Req() request: AuthRequest,
    @Body(new InputPipe(UpdateProfileSchema)) input: UpdateProfile,
  ) {
    return ProfileSchema.parse(
      await this.profiles.updateProfile(sessionBinding(request), input),
    );
  }
  @Get('preferences')
  @ApiOkResponse({ type: PreferencesDto })
  @RateLimit({
    key: 'users.preferences.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async preferences(@Req() request: AuthRequest) {
    return PreferencesSchema.parse(
      await this.profiles.preferences(sessionBinding(request)),
    );
  }
  @Patch('preferences')
  @BrowserMutation()
  @ApiBody({ type: UpdatePreferencesDto })
  @ApiOkResponse({ type: PreferencesDto })
  @RateLimit({
    key: 'users.preferences.write',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'principal',
  })
  async updatePreferences(
    @Req() request: AuthRequest,
    @Body(new InputPipe(UpdatePreferencesSchema)) input: UpdatePreferences,
  ) {
    return PreferencesSchema.parse(
      await this.profiles.updatePreferences(sessionBinding(request), input),
    );
  }
}
