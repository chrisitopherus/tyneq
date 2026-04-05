
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
    if (param === null || typeof param !== "object") {
        throw new TypeError("nameof expects a non-null object with exactly one own enumerable property.");
    }

    const keys = Object.keys(param);
    if (keys.length !== 1) {
        throw new TypeError("nameof expects an object with exactly one own enumerable property.");
    }

    const key = keys[0];
    return [key, param[key]] as [string, T];
}
