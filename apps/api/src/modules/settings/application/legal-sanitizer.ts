/**
 * Allow-list sanitiser for the legal Markdown subset (headings, paragraphs,
 * lists, https links). No HTML survives: tags, comments and stray angle
 * brackets are removed; images become their alt text; links keep only https
 * targets without credentials; reference definitions/code spans are dropped.
 * Clients still render the result as Markdown without raw HTML.
 */
export function sanitizeLegalMarkdown(input: string): string {
  let text = input
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2064\uFEFF]/g, '');
  text = text
    .replace(/<!--[\s\S]*?(-->|$)/g, '')
    .replace(/<\/?[A-Za-z][^>]*>?/g, '')
    .replace(/[<>]/g, '')
    // Images: keep alt text only (no remote fetches from legal pages).
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\(([^)\s]*)(?:\s+"[^"]*")?\)/g, (_match, label: string, href: string) =>
      safeHttps(href) ? `[${label}](${href})` : label,
    )
    // Reference-style definitions could smuggle unsafe targets.
    .replace(/^\s{0,3}\[[^\]]+\]:.*$/gm, '')
    .replace(/`+/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

function safeHttps(href: string): boolean {
  if (!/^https:\/\//i.test(href)) return false;
  try {
    const url = new URL(href);
    return (
      url.protocol === 'https:' && !url.username && !url.password && !!url.hostname
    );
  } catch {
    return false;
  }
}
