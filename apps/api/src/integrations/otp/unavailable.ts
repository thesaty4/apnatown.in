import type { OtpDeliveryPort } from './port';

export class UnavailableOtpDelivery implements OtpDeliveryPort {
  async send(): Promise<never> {
    throw new Error('OTP_PROVIDER_NOT_CONFIGURED');
  }
}
