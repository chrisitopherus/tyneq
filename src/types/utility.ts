export type Nullable<T> = T | null;
export type Undefinedable<T> = T | undefined;
export type Optional<T> = T | null | undefined;
export type HasLength = { length: number };
export type GenericFunction = (...x: never[]) => unknown;
export type Assume<T, U> = T extends U ? T : U;
export type Cast<T> = T;