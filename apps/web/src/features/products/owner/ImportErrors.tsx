'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { PRODUCT_IMPORT_ROW_ERROR_CODES } from '@apnatown/shared/products';
import type { ApiFailure } from '../../../shared/api/result';
import { Alert } from '../../businesses/parts';
import { productErrorKey } from './errors';

const known = new Set<string>(PRODUCT_IMPORT_ROW_ERROR_CODES);

/** Wire row code (snake_case) → camelCase catalogue key; unknown → invalidValue. */
const codeKey = (code: string) =>
  (known.has(code) ? code : 'invalid_value').replace(/_([a-z])/gu, (_, c: string) =>
    c.toUpperCase(),
  );

/** Column names are the file's literal headers: shown verbatim, LTR. */
function Columns({ names }: { names: readonly string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {names.map((name) => (
        <code
          key={name}
          dir="ltr"
          className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-caption"
        >
          {name}
        </code>
      ))}
    </span>
  );
}

/**
 * Import failure detail. Nothing was imported: a 422 lists localized row
 * errors (bounded by the server) or the header mismatch; 413/503 and other
 * failures get their own message. Never shows partial success.
 */
export function ImportErrors({ failure }: { failure: ApiFailure }) {
  const t = useTranslations('products.import');
  const te = useTranslations('products.errors');
  const format = useFormatter();
  const { details } = failure;

  if (failure.code === 'PRODUCT_IMPORT_INVALID' && details.field === 'headers')
    return (
      <Alert tone="bad" role="alert" title={t('headersTitle')}>
        <p className="m-0">{t('nothingImported')}</p>
        {details.expected && details.expected.length > 0 && (
          <p className="m-0">
            {t('headersExpected')} <Columns names={details.expected} />
          </p>
        )}
        {details.unknown && details.unknown.length > 0 && (
          <p className="m-0">
            {t('headersUnknown')} <Columns names={details.unknown} />
          </p>
        )}
      </Alert>
    );

  if (failure.code === 'PRODUCT_IMPORT_INVALID' && details.rows?.length) {
    const total = details.totalErrors ?? details.rows.length;
    return (
      <div className="grid gap-2">
        <Alert tone="bad" role="alert" title={t('rowsTitle', { count: total })}>
          <p className="m-0">{t('nothingImported')}</p>
          {total > details.rows.length && (
            <p className="m-0">
              {t('rowsTruncated', {
                shown: format.number(details.rows.length),
                total: format.number(total),
              })}
            </p>
          )}
        </Alert>
        <div className="max-h-80 overflow-auto rounded-md border border-border">
          <table className="w-full border-collapse text-small">
            <caption className="sr-only">{t('rowsCaption')}</caption>
            <thead className="sticky top-0 bg-primary-soft">
              <tr>
                <th scope="col" className="px-3 py-2 text-start">{t('row')}</th>
                <th scope="col" className="px-3 py-2 text-start">{t('column')}</th>
                <th scope="col" className="px-3 py-2 text-start">{t('problem')}</th>
              </tr>
            </thead>
            <tbody>
              {details.rows.map((row, index) => (
                <tr key={`${row.row}-${row.field ?? ''}-${index}`} className="border-t border-border">
                  <th scope="row" className="px-3 py-2 text-start font-semibold">
                    {format.number(row.row)}
                  </th>
                  <td className="px-3 py-2">
                    {row.field ? <Columns names={[row.field]} /> : t('wholeRow')}
                  </td>
                  <td className="px-3 py-2 [overflow-wrap:anywhere]">
                    {t(`codes.${codeKey(row.code)}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const tone = failure.code === 'PRODUCT_IMPORT_POLICY_REQUIRED' ? 'info' : 'bad';
  return (
    <Alert tone={tone} role="alert">
      <p className="m-0">{importMessage(failure, t, te)}</p>
      {tone === 'bad' && <p className="m-0">{t('nothingImported')}</p>}
    </Alert>
  );
}

type Translate = (key: string) => string;

/** 422 `{field:'file'|'rows'}` and 413 `{field:'file'|'rows'}` get specific
 * copy; a reused key with a different file (COMMON_CONFLICT) asks to choose
 * the file again. */
function importMessage(failure: ApiFailure, t: Translate, te: Translate) {
  const field = failure.details.field;
  if (failure.code === 'PRODUCT_IMPORT_INVALID' && field === 'file')
    return t('fileUnreadable');
  if (failure.code === 'PRODUCT_IMPORT_INVALID' && field === 'rows')
    return t('noRows');
  if (failure.code === 'PRODUCT_IMPORT_LIMIT' && field === 'rows')
    return t('limitRows');
  if (failure.code === 'PRODUCT_IMPORT_LIMIT' && field === 'file')
    return t('limitFile');
  if (failure.code === 'COMMON_CONFLICT') return t('chooseAgain');
  return te(productErrorKey(failure.code));
}
