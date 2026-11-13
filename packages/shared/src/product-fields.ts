/** Shared product limits and plain-text field builders (internal). */
import { z } from 'zod';

/** Maximum ordered image items per product (Media public-image policy). */
export const PRODUCT_MEDIA_LIMIT = 5;
/** Maximum product IDs per bulk/restock command (keyset page cap). */
export const PRODUCT_BULK_LIMIT = 50;
/** Q-49: “Mark in stock” on zero stock sets this quantity. */
export const PRODUCT_MARK_IN_STOCK_QUANTITY = 10;
/** Restock-low target quantity (S-VEND-08 “Restock all low items to 20”). */
export const PRODUCT_RESTOCK_TARGET = 20;
/** New-product inventory defaults (BE rule 3). */
export const PRODUCT_DEFAULT_STOCK = 10;
export const PRODUCT_DEFAULT_LOW_STOCK_THRESHOLD = 5;

export const STOCK_MAX = 2147483647;
export const plain = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !/[<>\p{Cc}]/u.test(value), {
      message: 'Plain text without angle brackets or control characters',
    });
/** Multi-line plain text: newline/tab allowed, other control characters not. */
export const multiline = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(
      // eslint-disable-next-line no-control-regex
      (value) => !/[<>\u0000-\u0008\u000B-\u001F\u007F-\u009F]/.test(value),
      { message: 'Plain text without angle brackets or control characters' },
    );
