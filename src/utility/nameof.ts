/**
 * Extracts the name and value of the first property of a single-key object literal.
 *
 * @remarks
 * Used throughout the library to obtain a parameter name as a string at call-sites without
 * hardcoding string literals. The caller passes `{ paramName }` (object shorthand) and receives
 * `[name, value]` back, where `name` is `"paramName"` and `value` is the runtime value.
 *
 * Only the first own enumerable key of `param` is read. Passing an object with more than one
 * property is valid but only the first key (in insertion order) is returned.
 *
 * @typeParam T - The type of the value being named.
 *
 * @param param - A single-property object whose key is the parameter name and value is the
 *   parameter value. Typically written as object shorthand: `{ myParam }`.
 *
 * @returns A tuple `[name, value]` where `name` is the string key and `value` is the
 *   corresponding value from `param`.
 *
 * @example
 * ```ts
 * function validate(count: number) {
 *     const [name, value] = nameof({ count });
 *     // name  → "count"
 *     // value → the runtime value of count
 * }
 * ```
 *
 * @group Utilities
 * @internal
 */
export function nameof<T>(param: Record<string, T>): [name: string, value: T] {
    const keys = Object.keys(param);
    const key = keys[0];
    return [key, param[key]] as [string, T];
}