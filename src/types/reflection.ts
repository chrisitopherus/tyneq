import type { Maybe } from "./utility";

/**
 * Describes a method (function-valued own property) on a reflected target.
 *
 * @group Reflection
 */
export interface MethodDescriptor {
    readonly kind: "method";
    readonly name: string | symbol;
    /** The raw function value. */
    readonly value: Function;
    /** Calls the method with the given `this` context and arguments. */
    readonly invoke: (thisArg: unknown, ...args: unknown[]) => unknown;
}

/**
 * Describes a data property (non-function own value property) on a reflected target.
 *
 * @group Reflection
 */
export interface DataDescriptor {
    readonly kind: "data";
    readonly name: string | symbol;
    readonly value: unknown;
    readonly writable: boolean;
    readonly configurable: boolean;
    readonly enumerable: boolean;
}

/**
 * Describes an accessor property (get and/or set) on a reflected target.
 *
 * @group Reflection
 */
export interface AccessorDescriptor {
    readonly kind: "accessor";
    readonly name: string | symbol;
    readonly get: Maybe<() => unknown>;
    readonly set: Maybe<(value: unknown) => void>;
    readonly configurable: boolean;
    readonly enumerable: boolean;
    /** `true` if the accessor defines a getter. */
    readonly canRead: boolean;
    /** `true` if the accessor defines a setter. */
    readonly canWrite: boolean;
}

/**
 * A discriminated union of all member descriptor types returned by {@link ReflectionContext}.
 *
 * Use `descriptor.kind` to narrow to the specific descriptor type.
 *
 * @group Reflection
 */
export type MemberDescriptor = MethodDescriptor | DataDescriptor | AccessorDescriptor;

/**
 * Options for the {@link reflect} factory.
 *
 * @group Reflection
 */
export interface ReflectOptions {
    /**
     * When `true`, walks the full prototype chain and includes inherited members
     * up to (but not including) `Object.prototype`.
     *
     * Equivalent to C# `BindingFlags.FlattenHierarchy`.
     *
     * @defaultValue false
     */
    readonly inherited?: boolean;
    /**
     * When `true`, includes Symbol-keyed members in addition to string-keyed members.
     *
     * @defaultValue false
     */
    readonly symbols?: boolean;
}
