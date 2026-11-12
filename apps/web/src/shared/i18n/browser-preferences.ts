import {
  localeCookie,
  themeCookie,
  type Locale,
  type Theme,
} from './preferences';

function preferenceCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

/** Non-sensitive rendering preferences only, never identity or consent evidence. */
export function applyPreferences({
  locale,
  theme,
}: {
  locale: Locale;
  theme: Theme;
}) {
  preferenceCookie(localeCookie, locale);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  preferenceCookie(themeCookie, theme);
  window.dispatchEvent(new Event('apnatown-theme'));
}

export function applyLocale(locale: Locale) {
  preferenceCookie(localeCookie, locale);
}
