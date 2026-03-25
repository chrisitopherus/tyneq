import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";

// ─────────────────────────────────────────────────────────────────────────────
// OperatorRegistry — central registry for all Tyneq operators
//
// All registration paths (@operator, @terminal, createOperator, etc.) flow
// through this class. It is the single source of truth for which operators are
// registered, their kind, and their implementation.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Structured metadata describing a registered operator.
 *
 * @remarks
 * Construct via the static factory methods rather than directly:
 * - {@link OperatorMetadata.streaming} — O(1)-space deferred operator
 * - {@link OperatorMetadata.buffer} — O(n)-space deferred operator
 * - {@link OperatorMetadata.terminal} — immediate, returns a value
 *
 * The `extensions` bag lets third-party operators attach arbitrary extra data
 * (version, deprecation notice, documentation URL, etc.) without modifying
 * this class:
 *
 * ```ts
 * OperatorRegistry.register({
 *     metadata: OperatorMetadata.streaming('myOp', {
 *         version: '1.0',
 *         docsUrl: 'https://example.com/myOp',
 *     }),
 *     impl: (source, ...args) => { ... }
 * });
 * ```
 *
 * @group Registry
 */
export class OperatorMetadata {
    /**
     * @param name       - The method name registered on `TyneqEnumerableBase.prototype`.
     * @param kind       - Execution category of this operator.
     * @param source     - Whether the operator was registered internally or by a third party.
     *   Defaults to `'external'`.
     * @param extensions - Optional bag of arbitrary extra metadata. Defaults to `{}`.
     */
    public constructor(
        public readonly name: string,
        public readonly kind: "streaming" | "buffer" | "terminal",
        public readonly source: "internal" | "external" = "external",
        public readonly extensions: Readonly<Record<string, unknown>> = {}
    ) {}

    /**
     * Creates metadata for a streaming operator registered by external code.
     *
     * @param name       - The method name to register.
     * @param extensions - Optional extra metadata bag.
     *
     * @group Registry
     */
    public static streaming(name: string, extensions?: Record<string, unknown>): OperatorMetadata {
        return new OperatorMetadata(name, "streaming", "external", extensions);
    }

    /**
     * Creates metadata for a buffer operator registered by external code.
     *
     * @param name       - The method name to register.
     * @param extensions - Optional extra metadata bag.
     *
     * @group Registry
     */
    public static buffer(name: string, extensions?: Record<string, unknown>): OperatorMetadata {
        return new OperatorMetadata(name, "buffer", "external", extensions);
    }

    /**
     * Creates metadata for a terminal operator registered by external code.
     *
     * @param name       - The method name to register.
     * @param extensions - Optional extra metadata bag.
     *
     * @group Registry
     */
    public static terminal(name: string, extensions?: Record<string, unknown>): OperatorMetadata {
        return new OperatorMetadata(name, "terminal", "external", extensions);
    }
}

/**
 * A registered operator entry combining metadata with its prototype implementation.
 *
 * @group Registry
 */
export interface OperatorEntry {
    readonly metadata: OperatorMetadata;
    readonly impl: (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) => unknown;
}

/**
 * Central registry for all Tyneq operators.
 *
 * @remarks
 * Every registration path — `@operator`, `@terminal`, `createOperator`,
 * `createGeneratorOperator`, and `createTerminalOperator` — routes through
 * `OperatorRegistry.register()`. The registry performs duplicate-name detection,
 * patches `TyneqEnumerableBase.prototype`, exposes introspection methods, and
 * supports lifecycle hooks, registration guards, and test-isolation via `unregister`.
 *
 * Guards run before an entry is stored and may throw to block registration.
 * Hooks fire after each successful registration and are for observation only.
 *
 * @group Registry
 */
export class OperatorRegistry {
    private static readonly _entries = new Map<string, OperatorEntry>();
    private static readonly _registrationHooks: Array<(entry: OperatorEntry) => void> = [];
    private static readonly _registrationGuards: Array<(entry: OperatorEntry) => void> = [];

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Registers an operator and patches `TyneqEnumerableBase.prototype` immediately.
     *
     * @remarks
     * Checks for duplicate names, runs guards in insertion order, stores the entry,
     * patches the prototype, then fires post-registration hooks in insertion order.
     *
     * Pass an `OperatorMetadata` instance constructed via its static factory methods
     * (`OperatorMetadata.streaming`, `.buffer`, `.terminal`) or directly via `new`.
     *
     * @param input - The operator entry to register.
     *
     * @throws {Error} If `input.metadata.name` is already registered.
     * @throws {Error} If any registration guard throws.
     *
     * @group Registry
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
        (TyneqEnumerableBase.prototype as unknown as Record<string, unknown>)[name] = input.impl;

        for (const hook of this._registrationHooks) {
            hook(input);
        }
    }

    /**
     * Remove an operator from the registry and from `TyneqEnumerableBase.prototype`.
     *
     * @remarks
     * Primarily useful for test isolation — use in `afterEach` to clean up
     * operators registered during a test without polluting the prototype for
     * subsequent test suites.
     *
     * @param name - The operator name to unregister.
     * @returns `true` if the operator existed and was removed; `false` if it was not registered.
     *
     * @group Registry
     */
    public static unregister(name: string): boolean {
        const entry = this._entries.get(name);
        if (!entry) {
            return false;
        }
        
        this._entries.delete(name);
        if (entry.metadata.source !== "internal") {
            delete (TyneqEnumerableBase.prototype as unknown as Record<string, unknown>)[name];
        }

        return true;
    }

    // ── Extensibility ─────────────────────────────────────────────────────────

    /**
     * Add a post-registration hook. Called after each successful `register()`.
     *
     * @remarks
     * Hooks fire in insertion order. They receive the full `OperatorEntry` but
     * cannot modify it — hooks are for observation only. To block registration,
     * use {@link addGuard} instead.
     *
     * @param hook - Callback receiving the newly registered entry.
     * @returns An unsubscribe function. Call it to remove the hook.
     *
     * @example
     * ```ts
     * const unsub = OperatorRegistry.onRegister(e =>
     *     console.log('[tyneq]', e.metadata.name, 'registered')
     * );
     * // later:
     * unsub();
     * ```
     *
     * @group Registry
     */
    public static onRegister(hook: (entry: OperatorEntry) => void): () => void {
        this._registrationHooks.push(hook);
        return () => {
            const i = this._registrationHooks.indexOf(hook);
            if (i !== -1) this._registrationHooks.splice(i, 1);
        };
    }

    /**
     * Add a registration guard. Called before each `register()`.
     *
     * @remarks
     * Throw from the guard to block the registration. Guards run before the
     * entry is stored in the Map and before the prototype is patched, so a
     * thrown guard leaves the registry in its previous state.
     *
     * Guards fire in insertion order. Once a guard throws, subsequent guards
     * for that call are not executed.
     *
     * @param guard - Callback receiving the candidate entry. Throw to block.
     * @returns An unsubscribe function. Call it to remove the guard.
     *
     * @example
     * ```ts
     * // Enforce camelCase naming convention
     * const removeGuard = OperatorRegistry.addGuard(entry => {
     *     if (!/^[a-z][a-zA-Z0-9]*$/.test(entry.metadata.name)) {
     *         throw new Error(`Operator name '${entry.metadata.name}' must be camelCase`);
     *     }
     * });
     * // later:
     * removeGuard();
     * ```
     *
     * @group Registry
     */
    public static addGuard(guard: (entry: OperatorEntry) => void): () => void {
        this._registrationGuards.push(guard);
        return () => {
            const i = this._registrationGuards.indexOf(guard);
            if (i !== -1) this._registrationGuards.splice(i, 1);
        };
    }

    // ── Introspection ─────────────────────────────────────────────────────────

    /**
     * Returns `true` if an operator with the given name is registered.
     *
     * @param name - The operator name to look up.
     *
     * @group Registry
     */
    public static has(name: string): boolean {
        return this._entries.has(name);
    }

    /**
     * Returns the metadata for a registered operator, or `undefined` if not found.
     *
     * @param name - The operator name to look up.
     *
     * @group Registry
     */
    public static get(name: string): OperatorMetadata | undefined {
        return this._entries.get(name)?.metadata;
    }

    /**
     * Returns a snapshot of all registered operator metadata, in registration order.
     *
     * @group Registry
     */
    public static list(): readonly OperatorMetadata[] {
        return [...this._entries.values()].map((e) => e.metadata);
    }

    /**
     * Returns a snapshot of operator metadata filtered by kind.
     *
     * @param kind - The operator kind to filter by.
     *
     * @group Registry
     */
    public static listByKind(kind: OperatorMetadata["kind"]): readonly OperatorMetadata[] {
        return this.list().filter((m) => m.kind === kind);
    }

    /**
     * Returns a snapshot of operator metadata filtered by source.
     *
     * @param source - `'internal'` for built-in Tyneq operators; `'external'` for
     *   operators registered by third-party code.
     *
     * @group Registry
     */
    public static listBySource(source: OperatorMetadata["source"]): readonly OperatorMetadata[] {
        return this.list().filter((m) => m.source === source);
    }

    /**
     * Returns the total number of registered operators.
     *
     * @group Registry
     */
    public static count(): number {
        return this._entries.size;
    }

    // ── Internal registration ─────────────────────────────────────────────────

    /**
     * Registers a built-in Tyneq operator in the registry **without** patching
     * `TyneqEnumerableBase.prototype`.
     *
     * @remarks
     * Built-in operators have their implementations declared directly on
     * `TyneqEnumerableBase`, so prototype patching is not needed. This method
     * exists purely to populate the registry for introspection
     * (`list()`, `listBySource('internal')`, `has()`, etc.).
     *
     * Guards are NOT run — guards are meant to validate external registrations.
     * Hooks ARE fired so tooling that observes all registrations receives a
     * complete picture.
     *
     * @param name - The operator name (matches the method name on `ITyneqEnumerable`).
     * @param kind - The execution category of the operator.
     *
     * @throws {Error} If an operator with the same name is already registered.
     *
     * @internal
     */
    public static registerBuiltin(name: string, kind: OperatorMetadata["kind"]): void {
        if (this._entries.has(name)) {
            const existing = this._entries.get(name)!.metadata;
            throw new Error(
                `[tyneq] Cannot register builtin '${name}' (${kind}): ` +
                `already registered as '${existing.kind}' from source '${existing.source}'.`
            );
        }

        // No-op impl: built-in operators live on TyneqEnumerableBase directly.
        const noopImpl = function (this: TyneqEnumerableBase<unknown>, ..._args: unknown[]): unknown {
            return undefined;
        };

        const entry: OperatorEntry = {
            metadata: new OperatorMetadata(name, kind, "internal"),
            impl: noopImpl,
        };

        // Do NOT patch prototype — the method is already on TyneqEnumerableBase.
        this._entries.set(name, entry);

        for (const hook of this._registrationHooks) {
            hook(entry);
        }
    }
}
