/** Input mechanics only. Codes are never generated, compared or verified here. */
export function distributeCode(
  previous: string[],
  input: string,
  index: number,
) {
  const digits = input.replace(/\D/g, '').slice(0, 6);
  const next = [...previous];
  const start = digits.length === 6 ? 0 : index;
  if (!digits) next[index] = '';
  for (let offset = 0; offset < digits.length && start + offset < 6; offset++)
    next[start + offset] = digits.charAt(offset);
  return { digits: next, focus: Math.min(5, start + digits.length) };
}

export function remainingSeconds(timestamp: string, now: number) {
  return Math.max(0, Math.ceil((Date.parse(timestamp) - now) / 1000));
}
