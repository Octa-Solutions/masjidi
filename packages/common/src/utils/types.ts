/**
 * Recursively makes all properties of a type optional.
 *
 * @typeParam T - The type to make partial.
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Recursively makes all properties of a type readonly.
 *
 * @typeParam T - The type to make readonly.
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

/**
 * A utility type to improve the readability of complex types in tooltips.
 * It forces the compiler to expand the type definition.
 *
 * @typeParam T - The type to prettify.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
