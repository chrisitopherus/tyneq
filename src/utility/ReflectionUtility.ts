import { Maybe, Method } from "../types/utility";

/**
 * Low-level helpers for prototype and descriptor introspection.
 *
 * @group Utilities
 * @internal
 */
export class ReflectionUtility {
    private constructor() { }

    public static getPrototypeMethod(proto: object, name: string): Method {
        const method = Object.getOwnPropertyDescriptor(proto, name)?.value;
        if (typeof method !== "function") {
            throw new Error(
                `[tyneq] Method '${name}' not found on prototype of ${Object.getPrototypeOf(proto)?.constructor?.name ?? "unknown"}.`
            );
        }

        return method as Method;
    }

    public static tryGetPrototypeMethod(proto: object, name: string): Maybe<Method> {
        const value = Object.getOwnPropertyDescriptor(proto, name)?.value;
        return typeof value === "function"
            ? value
            : undefined;
    }
}