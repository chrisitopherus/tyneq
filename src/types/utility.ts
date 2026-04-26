
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

/** A predicate over a sequence element and its zero-based index. */
export type ItemPredicate<T> = (item: T, index: number) => boolean;

/** A projection over a sequence element and its zero-based index. */
export type ItemSelector<T, TResult> = (item: T, index: number) => TResult;

/** A side-effect action over a sequence element and its zero-based index. */
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
 * Narrows `T` to `U` if `T extends U`; otherwise falls back to `U`.
 *
 * @remarks
 * Use this when you have a type variable `T` that you know satisfies `U` in context
 * but TypeScript cannot prove it statically. `Assume<T, U>` resolves to `T` when the
 * constraint holds and to `U` as a safe fallback when it does not -- avoiding `any`.
 *
 * @example
 * ```ts
 * // Generic return type constrained to the concrete key type:
 * type ValueAt<T, K extends keyof T> = Assume<T[K], string>;
 * // T[K] is string -> resolves to T[K] (the specific type is kept)
 * // T[K] is number -> resolves to string (falls back to the bound)
 * ```
 *
 * @group Types
 */
export type Assume<T, U> = T extends U ? T : U;

/**
 * Identity type -- preserves `T` as-is with no structural transformation.
 *
 * @remarks
 * Use `Cast<T>` as an explicit annotation in generic contexts where inference would
 * widen or lose the type, or where you want to document that a type is intentionally
 * passed through unchanged. It is a zero-cost no-op at both compile time and runtime.
 *
 * @example
 * ```ts
 * // Annotate a computed property type without changing it:
 * type Passthrough<T> = Cast<{ [K in keyof T]: T[K] }>;
 *
 * // Use as a readable annotation instead of a bare type parameter:
 * function identity<T>(value: Cast<T>): T { return value; }
 * ```
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
