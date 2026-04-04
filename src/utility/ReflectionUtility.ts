import { FieldKeys, Maybe, Method, MethodKeys } from "../types/utility";
import { ReflectionError } from "../core/errors/ReflectionError";

/**
 * Low-level helpers for prototype and descriptor introspection.
 *
 * @group Utilities
 */
export class ReflectionUtility {
    private constructor() { }

    // -------------------------------------------------------------------------
    // Single-member lookup
    // -------------------------------------------------------------------------

    /**
     * Returns the method with the given name from the prototype, or throws `ReflectionError`
     * if no such method exists directly on the prototype.
     *
     * @throws {ReflectionError} if the named property is absent or is not a function.
     */
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

    /**
     * Returns the method with the given name from the prototype, or `undefined` if absent
     * or not a function. Never throws.
     */
    public static tryGetPrototypeMethod(proto: object, name: string): Maybe<Method> {
        const value = Object.getOwnPropertyDescriptor(proto, name)?.value;
        return typeof value === "function"
            ? value
            : undefined;
    }

    /**
     * Returns `true` if the prototype has a method (function-valued own property) with
     * the given name; `false` otherwise.
     */
    public static hasMethod(proto: object, name: string): boolean {
        return typeof Object.getOwnPropertyDescriptor(proto, name)?.value === "function";
    }

    /**
     * Returns `true` if the prototype has an own property (of any kind) with the given name;
     * `false` otherwise. Includes data properties, accessors, and methods.
     */
    public static hasProperty(proto: object, name: string): boolean {
        return Object.prototype.hasOwnProperty.call(proto, name);
    }

    // -------------------------------------------------------------------------
    // Name-only enumeration (returns string keys)
    // -------------------------------------------------------------------------

    /**
     * Returns the names of all own method properties (function-valued) of the prototype.
     * Excludes `constructor`.
     *
     * @remarks
     * Returns string keys only. For the actual method values use {@link getMethods}.
     */
    public static getMethodNames<T extends object>(proto: T): readonly (MethodKeys<T> & string)[] {
        return Object.getOwnPropertyNames(proto).filter(
            (key) => key !== "constructor" && typeof Object.getOwnPropertyDescriptor(proto, key)?.value === "function"
        ) as (MethodKeys<T> & string)[];
    }

    /**
     * Returns the names of all own non-method properties (data fields) of the prototype.
     * Excludes `constructor`.
     *
     * @remarks
     * Returns string keys only. For the actual field values use {@link getFields}.
     */
    public static getFieldNames<T extends object>(proto: T): readonly (FieldKeys<T> & string)[] {
        return Object.getOwnPropertyNames(proto).filter(
            (key) => key !== "constructor" && typeof Object.getOwnPropertyDescriptor(proto, key)?.value !== "function"
        ) as (FieldKeys<T> & string)[];
    }

    /**
     * Returns the names of all own properties of the prototype (methods + fields).
     * Excludes `constructor`.
     *
     * @remarks
     * Returns string keys only. For the actual values split by kind use
     * {@link getMethods} and {@link getFields}.
     */
    public static getPropertyNames<T extends object>(proto: T): readonly (keyof T & string)[] {
        return Object.getOwnPropertyNames(proto).filter(
            (key) => key !== "constructor"
        ) as (keyof T & string)[];
    }

    // -------------------------------------------------------------------------
    // Value enumeration (returns records keyed by prototype keys)
    // -------------------------------------------------------------------------

    /**
     * Returns all own method properties of the prototype as a plain record.
     * Excludes `constructor`.
     *
     * @remarks
     * Only own function-valued properties are included. Inherited methods are not returned.
     */
    public static getMethods<T extends object>(proto: T): Readonly<Pick<T, MethodKeys<T>>> {
        const result: Partial<Pick<T, MethodKeys<T>>> = {};
        for (const key of Object.getOwnPropertyNames(proto)) {
            if (key === "constructor") continue;

            const propertyDescriptor = Object.getOwnPropertyDescriptor(proto, key);
            if (typeof propertyDescriptor?.value === "function") {
                (result as any)[key] = propertyDescriptor.value;
            }
        }

        return result as Readonly<Pick<T, MethodKeys<T>>>;
    }

    /**
     * Returns all own non-method (data field) properties of the prototype as a plain record.
     * Excludes `constructor`.
     *
     * @remarks
     * Only own data properties are included — accessor properties (getters/setters) and methods
     * are excluded. Inherited properties are not returned.
     */
    public static getFields<T extends object>(proto: T): Readonly<Pick<T, FieldKeys<T>>> {
        const result: Partial<Pick<T, FieldKeys<T>>> = {};
        for (const key of Object.getOwnPropertyNames(proto)) {
            if (key === "constructor") continue;

            const propertyDescriptor = Object.getOwnPropertyDescriptor(proto, key);
            // Only include data properties (has a value descriptor, not an accessor get/set pair)
            if (propertyDescriptor !== undefined && "value" in propertyDescriptor && typeof propertyDescriptor.value !== "function") {
                (result as any)[key] = propertyDescriptor.value;
            }
        }

        return result as Readonly<Pick<T, FieldKeys<T>>>;
    }
}
