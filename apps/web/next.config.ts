import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { parseWebEnvironment } from './src/shared/config/schema';

const environment = parseWebEnvironment(process.env);
const config: NextConfig = {
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
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
