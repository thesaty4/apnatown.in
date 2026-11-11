export const OTP_DELIVERY = Symbol('OTP_DELIVERY');
export interface OtpDeliveryPort {
  send(input: {
    challengeId: string;
    phone: string;
    code: string;
    expiresAt: Date;
  }): Promise<void>;
}
