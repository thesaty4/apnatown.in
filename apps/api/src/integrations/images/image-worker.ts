import sharp from 'sharp';
import { z } from 'zod';
import { ImagePolicySchema } from '@apnatown/shared/settings';

sharp.cache(false);
sharp.concurrency(1);
const requestSchema = z.object({
  body: z.string().max(7_000_000),
  mime: z.string(),
  policy: ImagePolicySchema,
});

function sniff(bytes: Buffer): string {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    // libvips can read the first frame of an APNG; reject its animation chunk.
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = bytes.readUInt32BE(offset);
      if (bytes.toString('ascii', offset + 4, offset + 8) === 'acTL') throw new Error('ANIMATION');
      offset += size + 12;
    }
    return 'image/png';
  }
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp';
  throw new Error('TYPE');
}

async function processImage(value: unknown) {
  const { body, mime, policy } = requestSchema.parse(value);
  const bytes = Buffer.from(body, 'base64');
  if (bytes.length > policy.maxBytes || sniff(bytes) !== mime ||
      !policy.allowedMimeTypes.some((type) => type === mime)) throw new Error('TYPE');
  const options = { limitInputPixels: policy.maxPixels, failOn: 'warning' as const };
  const metadata = await sharp(bytes, options).metadata();
  if (!metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1)
    throw new Error('IMAGE');
  const swap = metadata.orientation && metadata.orientation >= 5;
  const width = swap ? metadata.height : metadata.width;
  const height = swap ? metadata.width : metadata.height;
  if (width < policy.minWidth || height < policy.minHeight ||
      width > policy.maxWidth || height > policy.maxHeight ||
      width * height > policy.maxPixels) throw new Error('DIMENSIONS');
  const variants = [];
  const widths = new Set<number>();
  for (const variant of policy.variants) {
    const target = Math.min(width, variant.width);
    if (widths.has(target)) continue;
    widths.add(target);
    let ready = false;
    for (let quality = policy.quality; quality >= policy.minQuality; quality -= 5) {
      const output = await sharp(bytes, options).rotate()
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality }).toBuffer({ resolveWithObject: true });
      if (output.data.length > variant.maxBytes) continue;
      variants.push({ width: output.info.width, height: output.info.height,
        body: output.data.toString('base64') });
      ready = true;
      break;
    }
    if (!ready) throw new Error('BUDGET');
  }
  return { width, height, variants };
}

process.once('message', (message: unknown) => {
  void processImage(message).then(
    (result) => process.send?.({ result }, () => process.exit(0)),
    () => process.send?.({ error: 'MEDIA_IMAGE_PROCESSING_FAILED' }, () => process.exit(1)),
  );
});
