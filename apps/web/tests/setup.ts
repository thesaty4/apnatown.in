import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute('data-theme');
  document.cookie = 'apnatown-theme=; Max-Age=0; Path=/';
});
