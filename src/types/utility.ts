
/** `T | null` */
export type Nullable<T> = T | null;

/** `T | undefined` */
export type Undefinedable<T> = T | undefined;

/** `T | null | undefined` */
export type Optional<T> = T | null | undefined;

/** Any object with a `length` property. */
export type HasLength = { length: number };

/** Any function with any number of arguments. */
export type GenericFunction = (...x: never[]) => unknown;

/**
 * Narrows `T` to `U` if `T extends U`, otherwise uses `U`.
 *
 * @group Types
 */
export type Assume<T, U> = T extends U ? T : U;

/**
 * Identity type — preserves `T` as-is.
 *
 * @remarks
 * Used in positions where an explicit type annotation is needed but no transformation is intended.
 *
 * @group Types
 */
export type Cast<T> = T;
