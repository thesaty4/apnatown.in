import type { ReactNode } from 'react';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { LegalPage as LegalPageData } from '@apnatown/shared/settings';

type Block =
  | { kind: 'heading'; level: 2 | 3 | 4; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'paragraph'; text: string };

/** Parse the server-sanitised Markdown subset into blocks. Everything is
 * rendered as React text; no HTML string is ever injected. */
function blocks(body: string): Block[] {
  const result: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | undefined;
  const flush = () => {
    if (paragraph.length)
      result.push({ kind: 'paragraph', text: paragraph.join(' ') });
    if (list) result.push({ kind: 'list', ...list });
    paragraph = [];
    list = undefined;
  };
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\d{1,3}[.)]\s+(.*)$/.exec(line);
    if (!line) flush();
    else if (heading) {
      flush();
      const depth = heading[1]?.length ?? 1;
      result.push({
        kind: 'heading',
        // The page title is the only h1.
        level: depth <= 2 ? 2 : depth === 3 ? 3 : 4,
        text: heading[2] ?? '',
      });
    } else if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (paragraph.length || (list && list.ordered !== ordered)) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)?.[1] ?? '');
    } else {
      if (list) flush();
      paragraph.push(line);
    }
  }
  flush();
  return result;
}

function safeHttps(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

/** Inline: `[label](https://…)` links and **bold**; anything else is text. */
function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index;
    if (index > last) parts.push(text.slice(last, index));
    const [whole, label, href, bold] = match;
    const safe = href ? safeHttps(href) : undefined;
    if (bold) parts.push(<strong key={index}>{bold}</strong>);
    else if (safe)
      parts.push(
        <a
          key={index}
          href={safe}
          rel="noopener noreferrer nofollow"
          className="font-semibold text-primary-ink underline focus-visible:ring-focus"
        >
          {label}
        </a>,
      );
    else parts.push(label ?? whole);
    last = index + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** S-CUST-31..33 legal layout: title, last updated (IST), sanitised body. */
export async function LegalPage({
  page,
  children,
}: {
  page: LegalPageData;
  children?: ReactNode;
}) {
  const t = await getTranslations('legal');
  const format = await getFormatter();
  const updated = new Date(page.updatedAt);
  return (
    <article lang={page.locale} className="grid max-w-prose gap-4">
      <h1 className="text-h1 [overflow-wrap:anywhere]">{page.title}</h1>
      <p className="text-small text-muted">
        {t('page.updated', {
          date: format.dateTime(updated, {
            dateStyle: 'long',
            timeZone: 'Asia/Kolkata',
          }),
        })}
      </p>
      <div className="grid gap-3 text-text-2 [overflow-wrap:anywhere]">
        {blocks(page.body).map((block, index) => {
          if (block.kind === 'heading') {
            const Heading = `h${block.level}` as const;
            return (
              <Heading
                key={index}
                className={`${block.level === 2 ? 'text-h3' : 'text-h4'} text-text`}
              >
                {inline(block.text)}
              </Heading>
            );
          }
          if (block.kind === 'list') {
            const List = block.ordered ? 'ol' : 'ul';
            return (
              <List
                key={index}
                className={`grid gap-1 ps-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{inline(item)}</li>
                ))}
              </List>
            );
          }
          return <p key={index}>{inline(block.text)}</p>;
        })}
      </div>
      {children}
    </article>
  );
}

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-semibold text-primary-ink underline focus-visible:ring-focus"
    >
      {children}
    </Link>
  );
}
