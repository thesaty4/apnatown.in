'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { ReviewCard, ReviewSummary } from '@apnatown/shared/reviews';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { NavIcon } from '../../shared/ui/NavIcon';

export function Stars({
  rating,
  label,
  size = 'size-4',
}: {
  rating: number;
  label: string;
  size?: string;
}) {
  const filled = Math.round(rating);
  return (
    <span role="img" aria-label={label} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <NavIcon
          key={star}
          name="star"
          filled={star <= filled}
          className={`${size} ${star <= filled ? 'text-warning' : 'text-border'}`}
        />
      ))}
    </span>
  );
}

/** Prototype `ratingBreak`: average, stars, count and 5→1 bars. */
export function RatingSummary({ summary }: { summary: ReviewSummary }) {
  const t = useTranslations('reviews.section');
  const total = summary.count || 1;
  return (
    <Card
      padded
      className="grid gap-stack-gap tablet:grid-cols-[auto_minmax(0,1fr)] tablet:items-center"
    >
      <div className="grid justify-items-center gap-1 text-center tablet:min-w-40 tablet:border-e tablet:border-border tablet:pe-stack-gap">
        <p className="m-0 font-display text-[2.2rem] leading-none font-bold">
          {summary.average === null ? '—' : summary.average.toFixed(1)}
        </p>
        <Stars
          rating={summary.average ?? 0}
          label={
            summary.average === null
              ? t('noRatings')
              : t('starsLabel', { rating: summary.average })
          }
        />
        <p className="m-0 text-caption text-muted">
          {t('count', { count: summary.count })}
        </p>
      </div>
      <ul className="m-0 grid list-none gap-1.5 p-0">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.breakdown[star - 1] ?? 0;
          return (
            <li
              key={star}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-small"
            >
              <span aria-hidden="true">{star}★</span>
              <span
                role="img"
                aria-label={t('barLabel', { star, count })}
                className="h-2 overflow-hidden rounded-pill bg-surface-2"
              >
                <span
                  className="block h-full rounded-pill bg-warning"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </span>
              <span aria-hidden="true" className="text-end text-text-2">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Prototype `revCard`: author, stars, date, text, tags, helpful, reply. */
export function ReviewItem({ review }: { review: ReviewCard }) {
  const t = useTranslations('reviews.section');
  const format = useFormatter();
  return (
    <Card padded className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-pill bg-primary-soft font-semibold text-primary"
          >
            {review.authorLabel.charAt(0)}
          </span>
          <b className="[overflow-wrap:anywhere]">{review.authorLabel}</b>
        </span>
        <time dateTime={review.createdAt} className="text-caption text-muted">
          {format.dateTime(new Date(review.createdAt), {
            dateStyle: 'medium',
            timeZone: 'Asia/Kolkata',
          })}
        </time>
      </div>
      <Stars
        rating={review.rating}
        label={t('starsLabel', { rating: review.rating })}
      />
      <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
        {review.text}
      </p>
      {review.tags.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {review.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-pill bg-surface-2 px-2.5 py-0.5 text-caption"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 text-caption text-text-2">
        {review.helpfulCount > 0 && (
          <span>👍 {t('helpful', { count: review.helpfulCount })}</span>
        )}
        {review.status === 'reported' && (
          <StatusBadge tone="warn" icon="⚑" label={t('underReview')} />
        )}
      </div>
      {review.ownerReply && (
        <div className="grid gap-1 rounded-md border-s-4 border-primary bg-surface-2 px-3 py-2">
          <b className="text-small">{t('ownerReply')}</b>
          <p className="m-0 text-small whitespace-pre-wrap [overflow-wrap:anywhere]">
            {review.ownerReply}
          </p>
        </div>
      )}
    </Card>
  );
}
