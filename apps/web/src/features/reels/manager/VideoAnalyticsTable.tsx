'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';

const metrics = ['views', 'likes', 'shares', 'followers', 'linkTaps'] as const;

/**
 * Per-video analytics (spec "metrics unavailable" state). The owner analytics
 * endpoint is not available yet, so every metric says so explicitly — numbers
 * are never estimated or shown as zero.
 */
export function VideoAnalyticsTable() {
  const t = useTranslations('vendor.media.analytics');
  const headingId = useId();
  return (
    <Card padded className="grid gap-3">
      <div className="grid gap-1">
        <h2 id={headingId} className="m-0 text-h3">
          {t('title')}
        </h2>
        <p
          role="note"
          className="m-0 flex items-start gap-2 text-small text-text-2 [overflow-wrap:anywhere]"
        >
          <span aria-hidden="true">ℹ️</span>
          <span>{t('unavailable')}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table
          aria-labelledby={headingId}
          className="w-full min-w-0 border-collapse text-small"
        >
          <thead>
            <tr className="border-b border-border text-left text-text-2">
              <th scope="col" className="py-2 pe-3 font-semibold">
                {t('metric')}
              </th>
              <th scope="col" className="py-2 font-semibold">
                {t('value')}
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric} className="border-b border-border last:border-b-0">
                <th
                  scope="row"
                  className="py-2.5 pe-3 text-left font-normal [overflow-wrap:anywhere]"
                >
                  {t(`metrics.${metric}`)}
                </th>
                <td className="py-2.5 text-text-2">
                  <span aria-hidden="true">— </span>
                  {t('notAvailable')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
