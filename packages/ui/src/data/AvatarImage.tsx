'use client';

import { useCallback, useState } from 'react';
import { Skeleton } from '../feedback/Skeleton.js';

/** Internal image island: keep caller-supplied art visible after load failure.
 * The parent owns the single accessible image label; loading is decorative.
 */
export function AvatarImage({ src }: { src: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const imageRef = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete) setState(image.naturalWidth ? 'ready' : 'error');
  }, []);
  if (state === 'error') return null;
  return (
    <>
      <img
        ref={imageRef}
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        onLoad={() => setState('ready')}
        onError={() => setState('error')}
        className={`absolute inset-0 size-full object-cover ${state === 'loading' ? 'invisible' : ''}`}
      />
      {state === 'loading' && (
        <Skeleton
          label=""
          shape="block"
          aria-hidden="true"
          className="absolute inset-0"
        />
      )}
    </>
  );
}
