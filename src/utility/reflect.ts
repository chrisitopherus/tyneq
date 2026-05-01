import { ReflectionError } from "../core/errors/ReflectionError";
import type { Maybe } from "../types/utility";
import type {
    AccessorDescriptor,
    DataDescriptor,
    MemberDescriptor,
    MethodDescriptor,
    ReflectOptions,
} from "../types/reflection";

export type { AccessorDescriptor, DataDescriptor, MemberDescriptor, MethodDescriptor, ReflectOptions };

/**
 * The result of a {@link reflect} call. Provides typed access to the members of
 * the reflected target.
 *
 * @group Reflection
 */
export class ReflectionContext<_T extends object> {
    private readonly proto: object;
    private readonly options: ReflectOptions;

    /** @internal */
    public constructor(proto: object, options: ReflectOptions) {
        this.proto = proto;
        this.options = options;
    }

    /**
     * Returns descriptors for all own (and optionally inherited) members,
     * excluding `constructor`.
     */
    public members(): readonly MemberDescriptor[] {
        return this.collectDescriptors(this.proto);
    }

    /**
     * Returns descriptors for all method members (function-valued own properties),
     * excluding `constructor`.
     */
    public methods(): readonly MethodDescriptor[] {
        return this.members().filter((d): d is MethodDescriptor => d.kind === "method");
    }

    /**
     * Returns descriptors for all data members (non-function value properties).
     */
    public fields(): readonly DataDescriptor[] {
        return this.members().filter((d): d is DataDescriptor => d.kind === "data");
    }

    /**
     * Returns descriptors for all accessor members (get/set properties).
     */
    public accessors(): readonly AccessorDescriptor[] {
        return this.members().filter((d): d is AccessorDescriptor => d.kind === "accessor");
    }

    /**
     * Returns the descriptor for the named member, or `undefined` if not found.
     */
    public get(name: string | symbol): Maybe<MemberDescriptor> {
        return this.findDescriptor(name);
    }

    /**
     * Returns `true` if a member with the given name exists on the target.
     */
    public has(name: string | symbol): boolean {
        return this.findDescriptor(name) !== undefined;
    }

    /**
     * Returns the method descriptor for `name`, or throws {@link ReflectionError}
     * if the member does not exist or is not a method.
     *
     * @throws {ReflectionError} when the member is absent or is not a method.
     */
    public getMethod(name: string | symbol): MethodDescriptor {
        const descriptor = this.findDescriptor(name);
        if (descriptor === undefined) {
            const prototypeName = (this.proto as any)?.constructor?.name ?? "unknown";
            throw new ReflectionError(
                `Method "${String(name)}" not found on ${prototypeName}. ` +
                "Ensure the method is defined directly on the class, not inherited or deleted.",
                String(name),
                prototypeName
            );
        }
        if (descriptor.kind !== "method") {
            const prototypeName = (this.proto as any)?.constructor?.name ?? "unknown";
            throw new ReflectionError(
                `Member "${String(name)}" on ${prototypeName} is a ${descriptor.kind}, not a method.`,
                String(name),
                prototypeName
            );
        }

        return descriptor;
    }

    /**
     * Returns the accessor descriptor for `name`, or throws {@link ReflectionError}
     * if the member does not exist or is not an accessor.
     *
     * @throws {ReflectionError} when the member is absent or is not an accessor.
     */
    public getAccessor(name: string | symbol): AccessorDescriptor {
        const descriptor = this.findDescriptor(name);
        if (descriptor === undefined) {
            const prototypeName = (this.proto as any)?.constructor?.name ?? "unknown";
            throw new ReflectionError(
                `Accessor "${String(name)}" not found on ${prototypeName}.`,
                String(name),
                prototypeName
            );
        }
        if (descriptor.kind !== "accessor") {
            const prototypeName = (this.proto as any)?.constructor?.name ?? "unknown";
            throw new ReflectionError(
                `Member "${String(name)}" on ${prototypeName} is a ${descriptor.kind}, not an accessor.`,
                String(name),
                prototypeName
            );
        }

        return descriptor;
    }

    /**
     * Returns `true` if a method with the given name exists on the target.
     *
     * Unlike {@link has}, this returns `false` if the member exists but is an accessor or data property.
     */
    public hasMethod(name: string | symbol): boolean {
        return this.findDescriptor(name)?.kind === "method";
    }

    /**
     * Returns the method descriptor for `name`, or `undefined` if the member does not
     * exist or is not a method. Never throws.
     */
    public tryGetMethod(name: string | symbol): Maybe<MethodDescriptor> {
        const descriptor = this.findDescriptor(name);
        return descriptor?.kind === "method" ? descriptor : undefined;
    }

    private findDescriptor(name: string | symbol): Maybe<MemberDescriptor> {
        let current: object | null = this.proto;
        const stop = Object.prototype;

        while (current !== null && current !== stop) {
            const raw = Object.getOwnPropertyDescriptor(current, name);
            if (raw !== undefined) {
                return buildDescriptor(name, raw);
            }
            if (!this.options.inherited) break;

            current = Object.getPrototypeOf(current);
        }

        return undefined;
    }

    private collectDescriptors(startProto: object): readonly MemberDescriptor[] {
        const seen = new Set<string | symbol>();
        const results: MemberDescriptor[] = [];
        const stop = Object.prototype;

        let current: object | null = startProto;
        while (current !== null && current !== stop) {
            const keys: (string | symbol)[] = this.options.symbols
                ? Reflect.ownKeys(current)
                : Object.getOwnPropertyNames(current);

            for (const key of keys) {
                if (key === "constructor") continue;
                if (seen.has(key)) continue;

                seen.add(key);

                const raw = Object.getOwnPropertyDescriptor(current, key);
                if (raw === undefined) continue;

                const descriptor = buildDescriptor(key, raw);
                if (descriptor !== undefined) {
                    results.push(descriptor);
                }
            }

            if (!this.options.inherited) break;

            current = Object.getPrototypeOf(current);
        }

        return results;
    }
}

/**
 * Creates a {@link ReflectionContext} for the given target.
 *
 * The `target` can be:
 * - A **constructor function** -- reflects the class prototype (instance members). Preferred form.
 * - A **prototype object** (`MyClass.prototype`) -- reflects it directly.
 * - Any **object** -- reflects the object's own properties directly.
 *
 * @example
 * ```ts
 * import { reflect } from "tyneq/utility";
 *
 * class Service {
 *     public name = "svc";
 *     public get label(): string { return this.name; }
 *     public run(): void { /* ... *\/ }
 * }
 *
 * const ctx = reflect(Service);
 *
 * ctx.methods();   // -> [{ kind: "method", name: "run", ... }]
 * ctx.accessors(); // -> [{ kind: "accessor", name: "label", canRead: true, canWrite: false, ... }]
 *
 * const m = ctx.getMethod("run");
 * m.invoke(new Service()); // calls run()
 * ```
 *
 * Walk the full prototype chain:
 *
 * ```ts
 * const ctx = reflect(DerivedClass, { inherited: true });
 * ctx.members(); // includes members from base classes too
 * ```
 *
 * @group Reflection
 */
export function reflect<T extends object>(
    target: (new (...args: any[]) => T) | T,
    options: ReflectOptions = {}
): ReflectionContext<T> {
    const proto = resolveProto(target);
    return new ReflectionContext<T>(proto, options);
}

function resolveProto(target: (new (...args: any[]) => unknown) | object): object {
    if (typeof target === "function") {
        return (target as any).prototype as object;
    }

    return target;
}

function buildDescriptor(name: string | symbol, raw: PropertyDescriptor): Maybe<MemberDescriptor> {
    if ("get" in raw || "set" in raw) {
        return {
            kind: "accessor",
            name,
            get: raw.get as Maybe<() => unknown>,
            set: raw.set as Maybe<(value: unknown) => void>,
            configurable: raw.configurable ?? false,
            enumerable: raw.enumerable ?? false,
            canRead: typeof raw.get === "function",
            canWrite: typeof raw.set === "function",
        };
    }

    if (typeof raw.value === "function") {
        const fn = raw.value as Function;
        return {
            kind: "method",
            name,
            value: fn,
            invoke: (thisArg, ...args) => fn.apply(thisArg, args),
        };
    }

    if ("value" in raw) {
        return {
            kind: "data",
            name,
            value: raw.value,
            writable: raw.writable ?? false,
            configurable: raw.configurable ?? false,
            enumerable: raw.enumerable ?? false,
        };
    }

    return undefined;
}
