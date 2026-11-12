import type { TxContext } from '../../../shared/persistence/ports';

export const USERS_ADDRESS = Symbol('USERS_ADDRESS');
export interface UsersAddressPort {
  forCheckout(
    input: { userId: string; addressId: string; expectedVersion?: number },
    tx?: TxContext,
  ): Promise<{
    id: string;
    version: number;
    cityId: string;
    areaId: string | null;
    location: { lat: number; lng: number } | null;
    addressText: string;
    landmark: string | null;
    pinCode: string;
  }>;
}
