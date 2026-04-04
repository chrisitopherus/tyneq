
/**
 * Extracts the first property name and value from a single-property object.
 * Used to infer parameter names for error messages without string literals.
 *
 * @example
 * ```ts
 * const count = 5;
 * const [name, value] = nameof({ count }); // -> ["count", 5]
 * ```
 *
 * @internal
 */
export function nameof<T>(param: Record<string, T>): [name: string, value: T] {
    const keys = Object.keys(param);
    const key = keys[0];
    return [key, param[key]] as [string, T];
}
