import {
  AdminCategorySchema,
  AdminCategoryTreeSchema,
  AdminHomeSectionListSchema,
  AdminHomeSectionSchema,
  AdminSubcategorySchema,
  AdminSuggestionPageSchema,
  CategoryDetailSchema,
  CategoryListSchema,
  HomeSectionRemovedSchema,
  KeywordMappingDeletedSchema,
  KeywordMappingPageSchema,
  KeywordMappingSchema,
  SuggestionDuplicateResultSchema,
  SuggestionPageSchema,
  SuggestionSchema,
  type CategoryKind,
  type SuggestionStatus,
} from '@apnatown/shared/catalog';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';
import { commandHeaders, type Command } from '../super-admin/api';

type Reader = Pick<BrowserApi, 'GET'>;
type Dto = components['schemas'];
export type CreateCategoryBody = Dto['CreateCategoryDto'];
export type UpdateCategoryBody = Dto['UpdateCategoryDto'];
export type CreateSubcategoryBody = Dto['CreateSubcategoryDto'];
export type UpdateSubcategoryBody = Dto['UpdateSubcategoryDto'];
export type CreateHomeSectionBody = Dto['CreateHomeSectionDto'];
export type UpdateHomeSectionBody = Dto['UpdateHomeSectionDto'];
export type HomeSectionStatusBody = Dto['HomeSectionStatusDto'];
export type DecideSuggestionBody = Dto['DecideSuggestionDto'];
export type KeywordMappingBody = Dto['CreateKeywordMappingDto'];
export type UpdateKeywordMappingBody = Dto['UpdateKeywordMappingDto'];
export type SuggestBody = Dto['SuggestSubcategoryDto'];
export type DuplicateCheckBody = Dto['SuggestionDuplicateCheckDto'];
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});
const page = (cursor?: string) =>
  cursor ? { cursor, limit: 50 } : { limit: 50 };

// --- Public taxonomy (browser) --------------------------------------------

export async function listCategories(
  api: Reader,
  kind?: CategoryKind,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/catalog/categories', {
      params: { query: kind ? { kind } : {} },
      ...withSignal(signal),
    }),
    CategoryListSchema,
  );
}

export async function getCategory(
  api: Reader,
  slug: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/catalog/categories/{slug}', {
      params: { path: { slug } },
      ...withSignal(signal),
    }),
    CategoryDetailSchema,
  );
}

// --- Owner suggestions ----------------------------------------------------

export async function listMySuggestions(
  api: Reader,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/catalog/me/subcategory-suggestions', {
      params: { query: page(cursor) },
      ...withSignal(signal),
    }),
    SuggestionPageSchema,
  );
}

/** Read-only check, but a POST: CSRF/Origin come from the session transport. */
export async function checkSuggestionDuplicate(
  api: BrowserApi,
  body: DuplicateCheckBody,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/catalog/subcategory-suggestions/duplicate-check', {
      params: { header },
      body,
    }),
    SuggestionDuplicateResultSchema,
  );
}

export async function createSuggestion(
  api: BrowserApi,
  body: SuggestBody,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/catalog/subcategory-suggestions', {
      params: { header },
      body,
    }),
    SuggestionSchema,
  );
}

// --- Admin reads ----------------------------------------------------------

export async function getAdminTree(api: Reader, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/catalog/admin/categories', withSignal(signal)),
    AdminCategoryTreeSchema,
  );
}

export async function listHomeSections(api: Reader, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/catalog/admin/home-sections', withSignal(signal)),
    AdminHomeSectionListSchema,
  );
}

export async function listAdminSuggestions(
  api: Reader,
  status: SuggestionStatus,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/catalog/admin/subcategory-suggestions', {
      params: { query: { status, ...page(cursor) } },
      ...withSignal(signal),
    }),
    AdminSuggestionPageSchema,
  );
}

export async function listKeywordMappings(
  api: Reader,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/catalog/admin/keyword-mappings', {
      params: { query: page(cursor) },
      ...withSignal(signal),
    }),
    KeywordMappingPageSchema,
  );
}

// --- Admin commands (Idempotency-Key on every write) ---------------------

export async function decideSuggestion(
  api: BrowserApi,
  input: { id: string; decision: DecideSuggestionBody },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/catalog/admin/subcategory-suggestions/{id}/decision', {
      params: { header, path: { id: input.id } },
      body: input.decision,
    }),
    SuggestionSchema,
  );
}

export async function createCategory(
  api: BrowserApi,
  body: CreateCategoryBody,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/catalog/admin/categories', { params: { header }, body }),
    AdminCategorySchema,
  );
}

export async function updateCategory(
  api: BrowserApi,
  input: { categoryId: string; patch: UpdateCategoryBody },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PATCH('/catalog/admin/categories/{categoryId}', {
      params: { header, path: { categoryId: input.categoryId } },
      body: input.patch,
    }),
    AdminCategorySchema,
  );
}

export async function createSubcategory(
  api: BrowserApi,
  input: { categoryId: string; body: CreateSubcategoryBody },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/catalog/admin/categories/{categoryId}/subcategories', {
      params: { header, path: { categoryId: input.categoryId } },
      body: input.body,
    }),
    AdminSubcategorySchema,
  );
}

export async function updateSubcategory(
  api: BrowserApi,
  input: { subcategoryId: string; patch: UpdateSubcategoryBody },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PATCH('/catalog/admin/subcategories/{subcategoryId}', {
      params: { header, path: { subcategoryId: input.subcategoryId } },
      body: input.patch,
    }),
    AdminSubcategorySchema,
  );
}

export async function createHomeSection(
  api: BrowserApi,
  body: CreateHomeSectionBody,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/catalog/admin/home-sections', {
      params: { header },
      body,
    }),
    AdminHomeSectionSchema,
  );
}

export async function updateHomeSection(
  api: BrowserApi,
  input: { sectionId: string; patch: UpdateHomeSectionBody },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PATCH('/catalog/admin/home-sections/{sectionId}', {
      params: { header, path: { sectionId: input.sectionId } },
      body: input.patch,
    }),
    AdminHomeSectionSchema,
  );
}

export async function setHomeSectionStatus(
  api: BrowserApi,
  input: { sectionId: string; body: HomeSectionStatusBody },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/catalog/admin/home-sections/{sectionId}/status', {
      params: { header, path: { sectionId: input.sectionId } },
      body: input.body,
    }),
    AdminHomeSectionSchema,
  );
}

export async function removeHomeSection(
  api: BrowserApi,
  input: { sectionId: string; expectedVersion: number },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.DELETE('/catalog/admin/home-sections/{sectionId}', {
      params: { header, path: { sectionId: input.sectionId } },
      body: { expectedVersion: input.expectedVersion },
    }),
    HomeSectionRemovedSchema,
  );
}

export async function createKeywordMapping(
  api: BrowserApi,
  body: KeywordMappingBody,
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.POST('/catalog/admin/keyword-mappings', {
      params: { header },
      body,
    }),
    KeywordMappingSchema,
  );
}

export async function updateKeywordMapping(
  api: BrowserApi,
  input: { mappingId: string; patch: UpdateKeywordMappingBody },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.PATCH('/catalog/admin/keyword-mappings/{mappingId}', {
      params: { header, path: { mappingId: input.mappingId } },
      body: input.patch,
    }),
    KeywordMappingSchema,
  );
}

export async function deleteKeywordMapping(
  api: BrowserApi,
  input: { mappingId: string; expectedVersion: number },
  { key, assertCurrent }: Command,
) {
  const header = await commandHeaders(api, key, assertCurrent);
  return unwrap(
    await api.DELETE('/catalog/admin/keyword-mappings/{mappingId}', {
      params: { header, path: { mappingId: input.mappingId } },
      body: { expectedVersion: input.expectedVersion },
    }),
    KeywordMappingDeletedSchema,
  );
}
