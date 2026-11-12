'use client';

export type DeviceLocationFailure = 'denied' | 'unavailable' | 'unsupported';
export type DevicePosition = { lat: number; lng: number };

const round = (value: number) => Math.round(value * 1e6) / 1e6;

/** Asks the browser for the device position. Call only from an explicit user
 * action (never on load). Rejects with a {@link DeviceLocationFailure}. */
export function requestDeviceLocation(): Promise<DevicePosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject('unsupported' satisfies DeviceLocationFailure);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ lat: round(coords.latitude), lng: round(coords.longitude) }),
      (failure) =>
        reject(
          (failure.code === failure.PERMISSION_DENIED
            ? 'denied'
            : 'unavailable') satisfies DeviceLocationFailure,
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

export function deviceFailure(error: unknown): DeviceLocationFailure {
  return error === 'denied' || error === 'unsupported' ? error : 'unavailable';
}
