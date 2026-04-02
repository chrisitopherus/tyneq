import { Maybe, Method } from "../types/utility";
import { ReflectionError } from "../core/errors/ReflectionError";

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
            const prototypeName = (proto as any)?.constructor?.name ?? "unknown";
            throw new ReflectionError(
                `Method "${name}" not found on prototype of ${prototypeName}. ` +
                "Ensure the method is defined directly on the class, not inherited or deleted.",
                name,
                prototypeName
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