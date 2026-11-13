import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  ProductImportPolicyResultSchema,
  ProductImportResultSchema,
} from '@apnatown/shared/products';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';
import { kindHeader, withSignal, writeHeaders, type Reader } from './api';

/** `businessMeProductsImportPolicy`: limits + exact template headers. */
export async function getImportPolicy(
  api: Reader,
  kind: BusinessKind,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/products/import/policy', {
      params: { header: kindHeader(kind) },
      ...withSignal(signal),
    }),
    ProductImportPolicyResultSchema,
  );
}

/** `businessMeProductsImport`. All-or-nothing: 200 means every row was
 * created; any failure means none. */
export async function importProducts(
  api: BrowserApi,
  kind: BusinessKind,
  file: File,
  key: string,
  assertCurrent: () => void,
) {
  const header = await writeHeaders(api, kind, assertCurrent);
  return unwrap(
    await api.POST('/businesses/me/products/import', {
      params: { header: { ...header, 'Idempotency-Key': key } },
      // Typed multipart body; the serializer sends the real File (as in media uploads).
      body: { file: file.name },
      bodySerializer: () => {
        const form = new FormData();
        form.append('file', file);
        return form;
      },
    }),
    ProductImportResultSchema,
  );
}
