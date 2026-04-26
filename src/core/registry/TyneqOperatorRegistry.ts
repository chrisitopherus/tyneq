import { OperatorEntry, OperatorSource, SequenceConstructor } from "../../types/core";
import { OperatorMetadata } from "../OperatorMetadata";
import { reflect } from "../../utility/reflect";
import { Lazy } from "../../utility/Lazy";
import { RegistryError } from "../errors/RegistryError";
import { Maybe } from "../../types/utility";

/**
 * Central registry for all Tyneq operators.
 *
 * Every registration path - `@operator`, `@terminal`, `createOperator`,
 * `createGeneratorOperator`, `createTerminalOperator` - flows through this class.
 * It is the single source of truth for which operators exist, their kind, and their
 * prototype-level implementation.
 *
 * @example
 * ```ts
 * import { OperatorRegistry } from "tyneq/plugin";
 *
 * OperatorRegistry.has("where"); // -> true
 * OperatorRegistry.list(); // -> OperatorMetadata[]
 * ```
 *
 * @group Classes
 */
export class OperatorRegistry {
    private static readonly _entries = new Map<string, OperatorEntry>();
    private static readonly _registrationHooks: Array<(entry: OperatorEntry) => void> = [];
    private static readonly _registrationGuards: Array<(entry: OperatorEntry) => void> = [];

    // --- Registration ---

    /**
     * Registers an operator entry and patches the method onto `entry.metadata.targetClass.prototype`.
     *
     * @throws {RegistryError} When an operator with the same name is already registered.
     */
    public static register(input: OperatorEntry): void {
        const { name } = input.metadata;

        if (this._entries.has(name)) {
            const existing = this._entries.get(name)!.metadata;
            throw new RegistryError(
                `Cannot register "${name}" (${input.metadata.kind}): ` +
                `already registered as "${existing.kind}" from source "${existing.source}".`,
                name,
                input.metadata.kind,
                { kind: existing.kind, source: existing.source }
            );
        }

        if (input.metadata.targetClass === undefined) {
            throw new RegistryError(
                `Cannot register "${name}": targetClass is required for prototype-patching operators. Use registerSource() for source operators.`,
                name,
                input.metadata.kind
            );
        }

        for (const guard of this._registrationGuards) {
            guard(input);
        }

        this._entries.set(name, input);
        (input.metadata.targetClass.prototype as Record<string, unknown>)[name] = input.impl;

        for (const hook of this._registrationHooks) {
            hook(input);
        }
    }

    /**
     * Removes an operator registration and deletes the prototype method for external operators.
     *
     * @returns `true` if the operator was found and removed; `false` if no operator with that name existed.
     * @remarks
     * Internal operators (source `"internal"`) are not removed from the prototype - only
     * their registry entry is deleted.
     */
    public static unregister(name: string): boolean {
        const entry = this._entries.get(name);
        if (!entry) {
            return false;
        }

        this._entries.delete(name);
        if (entry.metadata.source !== "internal" && entry.metadata.targetClass !== undefined) {
            delete (entry.metadata.targetClass.prototype as Record<string, unknown>)[name];
        }

        return true;
    }

    // --- Extensibility ---

    /**
     * Registers a hook called after every successful operator registration.
     *
     * @returns A function that removes the hook when called.
     */
    public static onRegister(hook: (entry: OperatorEntry) => void): () => void {
        this._registrationHooks.push(hook);
        return () => {
            const i = this._registrationHooks.indexOf(hook);
            if (i !== -1) this._registrationHooks.splice(i, 1);
        };
    }

    /**
     * Registers a guard called before every registration.
     * Throw from the guard to reject the registration.
     *
     * @returns A function that removes the guard when called.
     */
    public static addGuard(guard: (entry: OperatorEntry) => void): () => void {
        this._registrationGuards.push(guard);
        return () => {
            const i = this._registrationGuards.indexOf(guard);
            if (i !== -1) this._registrationGuards.splice(i, 1);
        };
    }

    // --- Introspection ---

    /** Returns `true` if an operator with `name` is registered. */
    public static has(name: string): boolean {
        return this._entries.has(name);
    }

    /** Returns the full operator entry for `name`, or `undefined` if not registered. */
    public static get(name: string): Maybe<OperatorEntry> {
        return this._entries.get(name);
    }

    /** Returns the metadata for `name`, or `undefined` if not registered. */
    public static getMetadata(name: string): Maybe<OperatorMetadata> {
        return this._entries.get(name)?.metadata;
    }

    /** Returns metadata for all registered operators. */
    public static list(): readonly OperatorMetadata[] {
        return [...this._entries.values()].map((e) => e.metadata);
    }

    /** Returns metadata for all operators of `kind`. */
    public static listByKind(kind: OperatorMetadata["kind"]): readonly OperatorMetadata[] {
        return this.list().filter((m) => m.kind === kind);
    }

    /** Returns metadata for all operators from `source`. */
    public static listBySource(source: OperatorMetadata["source"]): readonly OperatorMetadata[] {
        return this.list().filter((m) => m.source === source);
    }

    /** Returns the total number of registered operators. */
    public static count(): number {
        return this._entries.size;
    }

    // --- Internal registration ---

    /**
     * Registers a source operator (a static factory, not a prototype method).
     *
     * @remarks
     * Source operators differ from prototype operators in two ways:
     * - They are called with `null` as `this` -- they have no instance.
     * - They are looked up by the compiler via `kind === "source"` rather than
     *   being patched onto a prototype.
     *
     * The entry is stored with `kind = "source"` and is never patched onto any prototype.
     * Registration guards run for `"external"` sources (same policy as {@link register}).
     * Guards are skipped for `"internal"` sources (same policy as {@link registerBuiltin}).
     *
     * Third-party source operators registered here are automatically compiled by
     * `QueryPlanCompiler` without any changes to the compiler.
     *
     * @param name - The operator name, matching the `operatorName` on the `QueryPlanNode`.
     * @param factory - The factory function; receives the node args in order, `this` is `null`.
     * @param source - Whether this is a built-in or external source operator. Defaults to `"external"`.
     *
     * @example
     * ```ts
     * import { OperatorRegistry } from "tyneq/plugin";
     * import { Tyneq } from "tyneq";
     *
     * OperatorRegistry.registerSource("fibonacci", (count) => {
     *     // return a Tyneq sequence of fibonacci numbers
     * });
     * ```
     *
     * @group Classes
     */
    public static registerSource(
        name: string,
        factory: (...args: unknown[]) => unknown,
        source: OperatorSource = "external"
    ): void {
        if (this._entries.has(name)) {
            const existing = this._entries.get(name)!.metadata;
            throw new RegistryError(
                `Cannot register source "${name}": ` +
                `already registered as "${existing.kind}" from source "${existing.source}".`,
                name,
                "source",
                { kind: existing.kind, source: existing.source }
            );
        }

        const entry: OperatorEntry = {
            metadata: OperatorMetadata.source(name, source),
            // Source factories have no `this` -- the impl ignores it and delegates to factory.
            impl: function (this: unknown, ...args: unknown[]) {
                return factory(...args);
            },
        };

        if (source !== "internal") {
            for (const guard of this._registrationGuards) {
                guard(entry);
            }
        }

        this._entries.set(name, entry);

        for (const hook of this._registrationHooks) {
            hook(entry);
        }
    }

    /**
     * Records a built-in operator in the registry without patching the prototype.
     * Built-in operators already live as direct methods on their target class.
     *
     * @remarks
     * Registration guards are intentionally skipped - builtins are internal and
     * trusted; guards exist to validate external plugin registrations only.
     *
     * @internal
     */
    public static registerBuiltin(
        name: string,
        kind: OperatorMetadata["kind"],
        targetClass: SequenceConstructor
    ): void {
        if (this._entries.has(name)) {
            const existing = this._entries.get(name)!.metadata;
            throw new RegistryError(
                `Cannot register builtin "${name}" (${kind}): ` +
                `already registered as "${existing.kind}" from source "${existing.source}".`,
                name,
                kind,
                { kind: existing.kind, source: existing.source }
            );
        }

        const lazyMethod = new Lazy(() => reflect(targetClass.prototype).getMethod(name).value);
        const entry: OperatorEntry = {
            metadata: new OperatorMetadata(name, kind, "internal", targetClass),
            impl: function (this: unknown, ...args: unknown[]) {
                const method = lazyMethod.value;
                if (!method) {
                    throw new RegistryError(
                        `Cannot invoke builtin "${name}" (${kind}): method not found on prototype. ` +
                        "Ensure the method exists on the target class before registering.",
                        name,
                        kind
                    );
                }

                return method.apply(this, args);
            },
        };

        this._entries.set(name, entry);

        for (const hook of this._registrationHooks) {
            hook(entry);
        }
    }
}
