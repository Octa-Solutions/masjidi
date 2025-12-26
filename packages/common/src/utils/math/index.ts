/**
 * Wraps a number within a specified range [min, max].
 * This is useful for cyclic values like hours (0-23) or degrees (0-360).
 *
 * @param value - The value to wrap.
 * @param min - The minimum value of the range.
 * @param max - The maximum value of the range.
 * @returns The wrapped value within the range [min, max].
 */
export function wrapNumber(value: number, min: number, max: number) {
  const range = max - min + 1;
  return ((((value - min) % range) + range) % range) + min;
}
