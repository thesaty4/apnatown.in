/**
 * Allow-list sanitiser for the legal Markdown subset (headings, paragraphs,
 * lists, https links). No HTML survives: tags, comments and stray angle
 * brackets are removed; images become their alt text; links keep only https
 * targets without credentials; reference definitions/code spans are dropped.
 * Clients still render the result as Markdown without raw HTML.
 */
// Control, bidi and zero-width characters (newline/tab are kept).
const invisible = (code: number): boolean =>
  (code <= 0x1f && code !== 0x09 && code !== 0x0a) ||
  (code >= 0x7f && code <= 0x9f) ||
  (code >= 0x200b && code <= 0x200f) ||
  (code >= 0x2028 && code <= 0x202e) ||
  (code >= 0x2060 && code <= 0x2064) ||
  code === 0xfeff;

const stripInvisible = (value: string): string =>
  Array.from(value)
    .filter((char) => !invisible(char.codePointAt(0) ?? 0))
    .join('');

export function sanitizeLegalMarkdown(input: string): string {
  let text = stripInvisible(input.replace(/\r\n?/g, '\n'));
  text = text
    .replace(/<!--[\s\S]*?(-->|$)/g, '')
    .replace(/<\/?[A-Za-z][^>]*>?/g, '')
    .replace(/[<>]/g, '')
    // Images: keep alt text only (no remote fetches from legal pages).
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(
      /\[([^\]]*)\]\(([^)\s]*)(?:\s+"[^"]*")?\)/g,
      (_match, label: string, href: string) =>
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
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !!url.hostname
    );
  } catch {
    return false;
  }
}
