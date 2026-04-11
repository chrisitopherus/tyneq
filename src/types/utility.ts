
/** `T | null` */
export type Nullable<T> = T | null;

/** `T | undefined` */
export type Maybe<T> = T | undefined;

/** `T | null | undefined` */
export type Optional<T> = T | null | undefined;

/** Any object with a `length` property. */
export type HasLength = { length: number };

/** Any function with any number of arguments. */
export type GenericFunction = (...x: never[]) => unknown;

/** A constructor type that can be instantiated with `new`. */
export type Constructor<TInstance = unknown, TArgs extends readonly any[] = any[]> = new (...args: TArgs) => TInstance;

/** A type that extracts the instance type from a constructor. */
export type InstanceOf<C> = C extends Constructor<infer TInstance> ? TInstance : never;

/** A type that prevents inference of `T` in generic functions. */
export type NoInfer<T> = [T][T extends any ? 0 : never];

/** A function that takes arguments of type `TArgs` (tuple) and returns void. */
export type Action<TArgs extends readonly unknown[] = []> = (...args: TArgs) => void;

/** A function that takes arguments of type `TArgs` (tuple) and returns a boolean. */
export type Predicate<TArgs extends readonly unknown[] = []> = (...args: TArgs) => boolean;

/** A predicate over a sequence element, optionally receiving its zero-based index. */
export type ItemPredicate<T> = (item: T, index: number) => boolean;

/** A projection over a sequence element, optionally receiving its zero-based index. */
export type ItemSelector<T, TResult> = (item: T, index: number) => TResult;

/** A side-effect action over a sequence element, optionally receiving its zero-based index. */
export type ItemAction<T> = (item: T, index: number) => void;

/** A function that takes arguments of type `TArgs` (tuple) and returns a value of type `TResult`. */
export type Func<TArgs extends readonly unknown[] = [], TResult = unknown> = (...args: TArgs) => TResult;

/** A method callable on a specific `this` context, returning `TReturn`. */
export type BoundMethod<TThis = unknown, TReturn = unknown> = (this: TThis, ...args: any[]) => TReturn;

/** A method callable on any `this` context with unknown arguments. */
export type Method = BoundMethod<unknown>;

/** A factory function that creates an instance of type `TInstance` given arguments of type `TArgs`. */
export type Factory<TInstance = unknown, TArgs extends readonly any[] = any[]> = (...args: TArgs) => TInstance;

/**
 * Narrows `T` to `U` if `T extends U`, otherwise uses `U`.
 *
 * @group Types
 */
export type Assume<T, U> = T extends U ? T : U;

/**
 * Identity type - preserves `T` as-is.
 *
 * @remarks
 * Used in positions where an explicit type annotation is needed but no transformation is intended.
 *
 * @group Types
 */
export type Cast<T> = T;

/** A type representing an object with assignable properties. */
export type WithProperties<K extends PropertyKey, V> =
    { [P in K]?: V } & Record<PropertyKey, unknown>;

/**
 * Extracts the keys of `T` whose value type extends `Function` (i.e. methods).
 *
 * @group Types
 */
export type MethodKeys<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Extracts the keys of `T` whose value type does NOT extend `Function` (i.e. data fields).
 *
 * @group Types
 */
export type FieldKeys<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];
