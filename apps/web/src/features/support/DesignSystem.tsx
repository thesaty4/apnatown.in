import type { ReactNode } from 'react';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Card } from '@apnatown/ui/cards/Card';
import { Badge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { publicHref } from '../../shared/i18n/preferences';

// Static class names so Tailwind emits every swatch.
const colours = [
  ['primary', 'bg-primary'],
  ['primary-soft', 'bg-primary-soft'],
  ['secondary', 'bg-secondary'],
  ['accent', 'bg-accent'],
  ['bg', 'bg-bg'],
  ['surface', 'bg-surface'],
  ['surface-2', 'bg-surface-2'],
  ['text', 'bg-text'],
  ['text-2', 'bg-text-2'],
  ['border', 'bg-border'],
  ['success', 'bg-success'],
  ['warning', 'bg-warning'],
  ['error', 'bg-error'],
  ['info', 'bg-info'],
  ['offer', 'bg-offer'],
] as const;

const type = [
  'text-h1',
  'text-h2',
  'text-h3',
  'text-h4',
  'text-body',
  'text-small',
  'text-caption',
] as const;
const tones: BadgeTone[] = ['ok', 'warn', 'bad', 'info', 'neutral'];
const variants = [
  'primary',
  'secondary',
  'outline',
  'text',
  'danger',
  'ghost',
] as const;
const systemPages = [
  ['/404', 'notFound'],
  ['/500', 'error'],
  ['/offline', 'offline'],
  ['/maintenance', 'maintenance'],
] as const;
const checklist = [
  'states',
  'languages',
  'viewports',
  'keyboard',
  'tokens',
] as const;

/** S-CUST-38: tokens, shared components, system pages and QA checklists,
 * rendered with the live `packages/ui` styles. */
export async function DesignSystem() {
  const t = await getTranslations('system.design');
  const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
  const section = (title: string, children: ReactNode) => (
    <section className="grid gap-3">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-h1">{t('title')}</h1>
        <p className="text-text-2">{t('intro')}</p>
      </header>
      {section(
        t('colours'),
        <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-4 desktop:grid-cols-5">
          {colours.map(([name, swatch]) => (
            <li key={name} className="grid gap-1">
              <span
                aria-hidden="true"
                className={`h-12 rounded-md border border-border ${swatch}`}
              />
              <code className="text-caption">--color-{name}</code>
            </li>
          ))}
        </ul>,
      )}
      {section(
        t('typography'),
        <div className="grid gap-2">
          {type.map((style) => (
            <p key={style} className={style}>
              {style} · {t('sample')}
            </p>
          ))}
        </div>,
      )}
      {section(
        t('components'),
        <Card padded className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {tones.map((tone) => (
              <Badge key={tone} tone={tone} label={tone} />
            ))}
          </div>
          <Input
            id="design-sample"
            label={t('sampleField')}
            hint={t('sample')}
          />
          <Skeleton label={t('loading')} />
        </Card>,
      )}
      {section(
        t('systemPages'),
        <ul className="flex flex-wrap gap-3">
          {systemPages.map(([path, key]) => (
            <li key={path}>
              <Link
                href={publicHref(path, locale)}
                className="inline-flex min-h-touch items-center underline focus-visible:ring-focus"
              >
                {path} · {t(`pages.${key}`)}
              </Link>
            </li>
          ))}
        </ul>,
      )}
      {section(
        t('checklist'),
        <ul className="grid list-disc gap-1 ps-5">
          {checklist.map((key) => (
            <li key={key}>{t(`checks.${key}`)}</li>
          ))}
        </ul>,
      )}
    </div>
  );
}
