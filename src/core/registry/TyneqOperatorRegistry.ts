import { OperatorEntry, SequenceConstructor } from "../../types/core";
import { TyneqEnumerableBase } from "../TyneqEnumerableBase";
import { OperatorMetadata } from "../OperatorMetadata";
import { ReflectionUtility } from "../../utility/ReflectionUtility";
import { Lazy } from "../../utility/Lazy";

/**
 * Central registry for all Tyneq operators.
 *
 * Every registration path -- `@operator`, `@terminal`, `createOperator`,
 * `createStreamingOperator`, `createTerminalOperator` -- flows through this class.
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
     * Registers an operator entry and patches the method onto `TyneqEnumerableBase.prototype`.
     *
     * @throws {Error} When an operator with the same name is already registered.
     */
    public static register(input: OperatorEntry): void {
        const { name } = input.metadata;

        if (this._entries.has(name)) {
            const existing = this._entries.get(name)!.metadata;
            throw new Error(
                `[tyneq] Cannot register '${name}' (${input.metadata.kind}): ` +
                `already registered as '${existing.kind}' from source '${existing.source}'.`
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
     * Internal operators (source `"internal"`) are not removed from the prototype -- only
     * their registry entry is deleted.
     */
    public static unregister(name: string): boolean {
        const entry = this._entries.get(name);
        if (!entry) {
            return false;
        }

        this._entries.delete(name);
        if (entry.metadata.source !== "internal") {
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
    public static get(name: string): OperatorEntry | undefined {
        return this._entries.get(name);
    }

    /** Returns the metadata for `name`, or `undefined` if not registered. */
    public static getMetadata(name: string): OperatorMetadata | undefined {
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
     * Records a built-in operator in the registry without patching the prototype.
     * Built-in operators already live as direct methods on `TyneqEnumerableBase`.
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
            throw new Error(
                `[tyneq] Cannot register builtin '${name}' (${kind}): ` +
                `already registered as '${existing.kind}' from source '${existing.source}'.`
            );
        }

        const lazyMethod = new Lazy(() => ReflectionUtility.getPrototypeMethod(targetClass.prototype, name));
        const entry: OperatorEntry = {
            metadata: new OperatorMetadata(name, kind, "internal", targetClass),
            impl: function (this: unknown, ...args: unknown[]) {
                const method = lazyMethod.value;
                if (!method) {
                    throw new Error(
                        `[tyneq] Cannot invoke builtin '${name}' (${kind}): ` +
                        "method not found on prototype."
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
