'use client';

import { Button } from '@apnatown/ui/primitives/Button';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';
import en from '../shared/i18n/messages/bootstrap.en.json';
import hi from '../shared/i18n/messages/bootstrap.hi.json';
import { fontVariables } from '../shared/i18n/fonts';
import './globals.css';

/** Root failure cannot rely on a working provider/request/API. Show both local copies. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" data-theme="light" className={fontVariables}>
      <head>
        <title>{en.common.error.snag}</title>
      </head>
      <body>
        <main>
          {(
            [
              ['en', en.common],
              ['hi', hi.common],
            ] as const
          ).map(([lang, copy]) => (
            <ErrorState
              key={lang}
              lang={lang}
              title={copy.error.snag}
              message={copy.error.message}
              action={
                <div className="grid justify-items-center gap-2">
                  <Button onClick={() => reset()}>{copy.actions.retry}</Button>
                  {error.digest && (
                    <p className="text-caption text-muted [overflow-wrap:anywhere]">
                      {copy.error.reference.replace('{id}', error.digest)}
                    </p>
                  )}
                </div>
              }
            />
          ))}
        </main>
      </body>
    </html>
  );
}
