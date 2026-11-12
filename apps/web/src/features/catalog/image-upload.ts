'use client';

import { useQuery } from '@tanstack/react-query';
import { MediaPolicyResultSchema, MediaUploadResultSchema } from '@apnatown/shared';
import { useAdmin } from '../admin';
import { privateQueryOptions } from '../../shared/api/private-query';
import { queryKeys } from '../../shared/api/query-keys';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { unwrap } from '../../shared/api/result';

export function useTaxonomyImageUpload() {
  const { api, scope, lifecycle } = useAdmin();
  const policy = useQuery({
    ...privateQueryOptions(
      [...queryKeys.admin(scope), 'taxonomy-image-policy'], scope.epoch, lifecycle,
      async (signal) => unwrap(
        await api.GET('/media/policies/catalog_taxonomy', { signal }),
        MediaPolicyResultSchema,
      ),
    ),
    staleTime: 0,
    retry: false,
  });
  const upload = usePrivateMutation(lifecycle,
    async ({ file, key }: { file: File; key: string }, assertCurrent) => {
      const headers = await api.mutationHeaders();
      assertCurrent();
      return unwrap(await api.POST('/media/uploads', {
        params: { header: { ...headers, 'Idempotency-Key': key } },
        body: { purpose: 'catalog_taxonomy', file: file.name },
        bodySerializer: () => {
          const form = new FormData();
          form.append('purpose', 'catalog_taxonomy');
          form.append('file', file);
          return form;
        },
      }), MediaUploadResultSchema);
    });
  return { policy, upload };
}
