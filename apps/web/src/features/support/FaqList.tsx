import { getTranslations } from 'next-intl/server';

export const FAQ_ITEMS = [
  'order',
  'split',
  'otp',
  'refunds',
  'outside',
] as const;

/** Prototype FAQ copy from i18n only; native details/summary keyboard support. */
export async function FaqList() {
  const t = await getTranslations('help.faq');
  return (
    <section aria-labelledby="faq-heading" className="grid gap-2">
      <h2 id="faq-heading" className="sr-only">
        {t('title')}
      </h2>
      {FAQ_ITEMS.map((item) => (
        <details
          key={item}
          className="group rounded-md border border-border bg-surface"
        >
          <summary className="flex min-h-touch cursor-pointer items-center justify-between gap-3 rounded-md px-4 py-3 font-semibold focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {t(`${item}.question`)}
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 transition-transform duration-2 group-open:rotate-180 motion-reduce:transition-none"
            >
              ⌄
            </span>
          </summary>
          <p className="px-4 pb-4 text-text-2 [overflow-wrap:anywhere]">
            {t(`${item}.answer`)}
          </p>
        </details>
      ))}
    </section>
  );
}
