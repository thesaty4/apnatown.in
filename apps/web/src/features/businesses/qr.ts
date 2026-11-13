'use client';

import { useQuery } from '@tanstack/react-query';

/** Local, offline-capable SVG render; never a CDN, never a stored asset. */
export function useQrSvg(url: string) {
  return useQuery({
    queryKey: ['local', 'qr', url],
    queryFn: async () => {
      const QRCode = (await import('qrcode')).default;
      return QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    },
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    networkMode: 'always',
    retry: false,
  });
}
