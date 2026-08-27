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
 * Internally the registry maintains two separate namespaces:
 * - Source factories (`Tyneq.from`, `Tyneq.range`, etc.) - keyed by name alone.
 * - Instance operators (`.where`, `.select`, etc.) - keyed by (name, targetClass).
 *
 * This means a source factory and an instance method can share a name without
 * conflict (e.g. `Tyneq.concat` and `seq.concat`), and two instance operators
 * with the same name on different prototype chains (e.g. `ordered.foo` and
 * `cached.foo`) also coexist without conflict.
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
    private static readonly _sources = new Map<string, OperatorEntry>();
    private static readonly _operators = new Map<string, Map<SequenceConstructor, OperatorEntry>>();

    private static readonly _registrationHooks: Array<(entry: OperatorEntry) => void> = [];
    private static readonly _registrationGuards: Array<(entry: OperatorEntry) => void> = [];

    /**
     * Registers an operator entry and patches the method onto `entry.metadata.targetClass.prototype`.
     *
     * @throws {RegistryError} When an operator with the same name is already registered on the same targetClass.
     */
    public static register(input: OperatorEntry): void {
        const { name } = input.metadata;

        if (input.metadata.targetClass === undefined) {
            throw new RegistryError(
                `Cannot register "${name}": targetClass is required for prototype-patching operators. Use registerSource() for source operators.`,
                name,
                input.metadata.kind
            );
        }

        const targetMap = this._operators.get(name);
        if (targetMap?.has(input.metadata.targetClass)) {
            const existing = targetMap.get(input.metadata.targetClass)!.metadata;
            throw new RegistryError(
                `Cannot register "${name}" (${input.metadata.kind}) on ${input.metadata.targetClass.name}: ` +
                `already registered as "${existing.kind}" from source "${existing.source}".`,
                name,
                input.metadata.kind,
                { kind: existing.kind, source: existing.source }
            );
        }

        this.runGuards(input);

        if (!this._operators.has(name)) {
            this._operators.set(name, new Map());
        }

        this._operators.get(name)!.set(input.metadata.targetClass, input);
        (input.metadata.targetClass.prototype as Record<string, unknown>)[name] = input.impl;

        for (const hook of this._registrationHooks) {
            hook(input);
        }
    }

    /**
     * Removes an operator registration and deletes the prototype method for external operators.
     *
     * Checks the instance operator namespace first, then the source namespace.
     *
     * @returns `true` if the operator was found and removed; `false` if no operator with that name existed.
     * @remarks
     * Internal operators (source `"internal"`) are not removed from the prototype - only
     * their registry entry is deleted.
     *
     * For targeted removal use {@link unregisterOperator} or {@link unregisterSource}.
     */
    public static unregister(name: string): boolean {
        if (this._operators.has(name)) {
            const targetMap = this._operators.get(name)!;
            for (const [targetClass, entry] of targetMap) {
                if (entry.metadata.source !== "internal" && targetClass !== undefined) {
                    delete (targetClass.prototype as Record<string, unknown>)[name];
                }
            }

            this._operators.delete(name);
            return true;
        }

        if (this._sources.has(name)) {
            this._sources.delete(name);
            return true;
        }

        return false;
    }

    /**
     * Removes a specific instance operator registration for a given (name, targetClass) pair
     * and deletes the prototype method for external operators.
     *
     * @returns `true` if the entry was found and removed; `false` otherwise.
     */
    public static unregisterOperator(name: string, targetClass: SequenceConstructor): boolean {
        const targetMap = this._operators.get(name);
        if (!targetMap?.has(targetClass)) {
            return false;
        }

        const entry = targetMap.get(targetClass)!;
        if (entry.metadata.source !== "internal") {
            delete (targetClass.prototype as Record<string, unknown>)[name];
        }

        targetMap.delete(targetClass);
        if (targetMap.size === 0) {
            this._operators.delete(name);
        }

        return true;
    }

    /**
     * Removes a source factory registration.
     *
     * @returns `true` if the source was found and removed; `false` otherwise.
     */
    public static unregisterSource(name: string): boolean {
        return this._sources.delete(name);
    }

    /**
     * Registers a hook called after every successful operator registration (both namespaces).
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
     * Registers a guard called before every external registration (both namespaces).
     * Throw from the guard to reject the registration.
     *
     * @remarks
     * Guards run for `source: "external"` registrations only - the same single policy
     * applied uniformly by {@link register}, {@link registerSource}, and
     * {@link registerBuiltin}. Internal registrations (Tyneq's own built-in operators and
     * sources) are trusted and never see guards; a guard enforcing naming conventions or
     * other plugin-author policy will never fire for `"internal"` entries.
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

    /**
     * Runs all registered guards against `entry` if its `metadata.source` is `"external"`.
     * Internal registrations (builtins and internal sources) are trusted and skip guards.
     */
    private static runGuards(entry: OperatorEntry): void {
        if (entry.metadata.source !== "external") {
            return;
        }

        for (const guard of this._registrationGuards) {
            guard(entry);
        }
    }

    /**
     * Returns `true` if a name exists in either the source or instance operator namespace.
     * Use {@link hasSource} or {@link hasOperator} for namespace-specific checks.
     */
    public static has(name: string): boolean {
        return this._sources.has(name) || this._operators.has(name);
    }

    /**
     * Returns `true` if a source factory with `name` is registered.
     */
    public static hasSource(name: string): boolean {
        return this._sources.has(name);
    }

    /**
     * Returns `true` if an instance operator with `name` is registered.
     * When `targetClass` is provided, checks only that specific (name, targetClass) pair.
     * When omitted, returns `true` if any target has an operator with that name.
     */
    public static hasOperator(name: string, targetClass?: SequenceConstructor): boolean {
        if (targetClass !== undefined) {
            return this._operators.get(name)?.has(targetClass) ?? false;
        }

        return this._operators.has(name);
    }

    /**
     * Returns the operator entry for `name` from either namespace, or `undefined` if not found.
     * Checks the instance operator namespace first, then the source namespace.
     * For namespace-specific retrieval use {@link getSource} or {@link getOperator}.
     */
    public static get(name: string): Maybe<OperatorEntry> {
        // Return the first instance operator entry found (any target)
        const targetMap = this._operators.get(name);
        if (targetMap !== undefined) {
            return targetMap.values().next().value;
        }

        return this._sources.get(name);
    }

    /**
     * Returns the source factory entry for `name`, or `undefined` if not registered.
     */
    public static getSource(name: string): Maybe<OperatorEntry> {
        return this._sources.get(name);
    }

    /**
     * Returns the instance operator entry for `name` on `targetClass`, or `undefined`.
     * When `targetClass` is omitted, returns the first entry found across all targets.
     */
    public static getOperator(name: string, targetClass?: SequenceConstructor): Maybe<OperatorEntry> {
        const targetMap = this._operators.get(name);
        if (targetMap === undefined) {
            return undefined;
        }

        if (targetClass !== undefined) {
            return targetMap.get(targetClass);
        }

        return targetMap.values().next().value;
    }

    /**
     * Returns the metadata for `name` from either namespace, or `undefined` if not found.
     * Checks instance operators first, then sources.
     */
    public static getMetadata(name: string): Maybe<OperatorMetadata> {
        return this.get(name)?.metadata;
    }

    /**
     * Returns metadata for all registered operators and source factories.
     * Use {@link listOperators} or {@link listSources} for namespace-specific lists.
     */
    public static list(): readonly OperatorMetadata[] {
        return [...this.listSources(), ...this.listOperators()];
    }

    /**
     * Returns metadata for all registered source factories.
     */
    public static listSources(): readonly OperatorMetadata[] {
        return [...this._sources.values()].map((e) => e.metadata);
    }

    /**
     * Returns metadata for all registered instance operators.
     * When `targetClass` is provided, returns only entries for that specific target class.
     */
    public static listOperators(targetClass?: SequenceConstructor): readonly OperatorMetadata[] {
        const all: OperatorMetadata[] = [];
        for (const targetMap of this._operators.values()) {
            if (targetClass !== undefined) {
                const entry = targetMap.get(targetClass);
                if (entry !== undefined) {
                    all.push(entry.metadata);
                }
            } else {
                for (const entry of targetMap.values()) {
                    all.push(entry.metadata);
                }
            }
        }

        return all;
    }

    /** Returns metadata for all operators of `kind` across both namespaces. */
    public static listByKind(kind: OperatorMetadata["kind"]): readonly OperatorMetadata[] {
        return this.list().filter((m) => m.kind === kind);
    }

    /** Returns metadata for all operators from `source` across both namespaces. */
    public static listBySource(source: OperatorMetadata["source"]): readonly OperatorMetadata[] {
        return this.list().filter((m) => m.source === source);
    }

    /** Returns the total number of registered operators across both namespaces. */
    public static count(): number {
        let operatorCount = 0;
        for (const targetMap of this._operators.values()) {
            operatorCount += targetMap.size;
        }

        return this._sources.size + operatorCount;
    }

    /**
     * Registers a source operator (a static factory, not a prototype method).
     *
     * @remarks
     * Source operators differ from prototype operators in two ways:
     * - They are called with `null` as `this` - they have no instance.
     * - They are looked up by the compiler via {@link getSource} rather than
     *   being patched onto a prototype.
     *
     * The entry is stored in the source namespace and is never patched onto any prototype.
     * Registration guards run for `"external"` sources (same policy as {@link register}).
    * Guards are skipped for `"internal"` sources (same policy used for internal builtins).
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
        if (this._sources.has(name)) {
            const existing = this._sources.get(name)!.metadata;
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
            impl: function (this: unknown, ...args: unknown[]) {
                return factory(...args);
            },
        };

        this.runGuards(entry);

        this._sources.set(name, entry);

        for (const hook of this._registrationHooks) {
            hook(entry);
        }
    }

    /**
     * Records a built-in operator in the instance operator namespace without patching the prototype.
     * Built-in operators already live as direct methods on their target class.
     *
     * @remarks
     * Registration guards are intentionally skipped, consistent with the single guard policy
     * documented on {@link addGuard} (guards run for `source: "external"` only - builtins are
     * always `"internal"`, so the outcome is identical to routing through {@link runGuards}).
     * Skipped via an explicit early return rather than by calling `runGuards(entry)` because
     * this entry's `metadata` is a lazy getter (see `lazyMetadata` below) - `runGuards` reads
     * `entry.metadata.source`, and calling it here would force that getter to evaluate eagerly,
     * defeating the deferral this method depends on. The source is always `"internal"` here by
     * construction, so no guard check is lost by skipping explicitly instead.
     *
     * @internal
     */
    public static registerBuiltin(
        name: string,
        kind: OperatorMetadata["kind"],
        targetClass: SequenceConstructor
    ): void {
        const targetMap = this._operators.get(name);
        if (targetMap?.has(targetClass)) {
            const existing = targetMap.get(targetClass)!.metadata;
            throw new RegistryError(
                `Cannot register builtin "${name}" (${kind}) on ${targetClass.name}: ` +
                `already registered as "${existing.kind}" from source "${existing.source}".`,
                name,
                kind,
                { kind: existing.kind, source: existing.source }
            );
        }

        const lazyMethod = new Lazy(() => reflect(targetClass.prototype).tryGetMethod(name)?.value);
        const lazyMetadata = new Lazy(() => new OperatorMetadata(name, kind, "internal", targetClass));
        const entry: OperatorEntry = {
            get metadata() {
                return lazyMetadata.value;
            },
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

        if (!this._operators.has(name)) {
            this._operators.set(name, new Map());
        }

        this._operators.get(name)!.set(targetClass, entry);

        for (const hook of this._registrationHooks) {
            hook(entry);
        }
    }
}
