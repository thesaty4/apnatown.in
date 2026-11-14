import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { parseWebEnvironment } from './src/shared/config/schema';

const environment = parseWebEnvironment(process.env);
const config: NextConfig = {
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  // Allow `/_next/*` dev requests when the dev server is reached through the
  // public tunnel instead of localhost (required by Next's dev origin check).
  allowedDevOrigins: ['roomier-ungoverning-carmelia.ngrok-free.dev'],
  transpilePackages: [
    '@apnatown/shared',
    '@apnatown/ui',
    '@apnatown/api-client',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${new URL(environment.API_INTERNAL_ORIGIN).origin}/api/:path*`,
      },
    ];
  },
};

export default createNextIntlPlugin('./src/shared/i18n/request.ts')(config);
