import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';

// ─────────────────────────────────────────────────────────────────────────────
// OperatorRegistry — central registry for all Tyneq operators
//
// All registration paths (@operator, @terminal, createOperator, etc.) flow
// through this class. It is the single source of truth for which operators are
// registered, their kind, and their implementation.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Describes the metadata associated with a registered operator.
 *
 * @remarks
 * The index signature `[key: string]: unknown` makes `OperatorMetadata` open for
 * extension — third-party operators can attach additional metadata (version,
 * deprecation notice, documentation URL, etc.) without modifying this interface.
 *
 * @group Registry
 */
export interface OperatorMetadata {
    /** The method name registered on `TyneqEnumerableBase.prototype`. */
    readonly name: string;
    /**
     * Operator category:
     * - `'streaming'` — transforms elements one-at-a-time (O(1) space)
     * - `'buffer'` — materialises part or all of the sequence (O(n) space)
     * - `'terminal'` — evaluates the sequence and returns a concrete value
     */
    readonly kind: 'streaming' | 'buffer' | 'terminal';
    /**
     * Whether the operator was registered by the Tyneq library itself (`'internal'`)
     * or by a third-party consumer (`'external'`).
     */
    readonly source: 'internal' | 'external';
    /** Open index signature — third-party operators may attach arbitrary metadata. */
    readonly [key: string]: unknown;
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
 * Input shape accepted by {@link OperatorRegistry.register}. Differs from `OperatorEntry`
 * in that `metadata.source` is optional — it defaults to `'internal'` when omitted.
 *
 * @group Registry
 */
export interface OperatorEntryInput {
    readonly metadata: Omit<OperatorMetadata, 'source'> & { readonly source?: 'internal' | 'external' };
    readonly impl: (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) => unknown;
}

/**
 * Central registry for all Tyneq operators.
 *
 * @remarks
 * Every registration path — `@operator`, `@terminal`, `createOperator`,
 * `createGeneratorOperator`, and `createTerminalOperator` — routes through
 * `OperatorRegistry.register()`. The registry is the single source of truth for:
 *
 * - Duplicate-name detection (throws with context on collision)
 * - Prototype patching (`TyneqEnumerableBase.prototype[name] = impl`)
 * - Introspection (`has`, `get`, `list`, `listByKind`, `count`)
 * - Lifecycle extensibility (`onRegister` hooks, `addGuard` guards)
 * - Test isolation (`unregister`)
 *
 * ## Registration Guards
 *
 * Guards run **before** an entry is stored. Throw from a guard to block
 * registration. Useful for enforcing naming conventions or reserved names:
 *
 * ```ts
 * OperatorRegistry.addGuard(entry => {
 *     if (!/^[a-z][a-zA-Z0-9]*$/.test(entry.metadata.name)) {
 *         throw new Error(`Operator name '${entry.metadata.name}' must be camelCase`);
 *     }
 * });
 * ```
 *
 * ## Post-Registration Hooks
 *
 * Hooks fire **after** a successful registration. Use them for logging, tooling,
 * or dev-tools integration without coupling to core:
 *
 * ```ts
 * const unsub = OperatorRegistry.onRegister(e =>
 *     console.log('[tyneq]', e.metadata.name, 'registered as', e.metadata.kind)
 * );
 * // later:
 * unsub(); // removes the hook
 * ```
 *
 * ## Test Isolation
 *
 * ```ts
 * afterEach(() => {
 *     OperatorRegistry.unregister('myTestOp');
 * });
 * ```
 *
 * @group Registry
 */
export class OperatorRegistry {
    private static readonly _entries = new Map<string, OperatorEntry>();
    private static readonly _registrationHooks: Array<(entry: OperatorEntry) => void> = [];
    private static readonly _registrationGuards: Array<(entry: OperatorEntry) => void> = [];

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Register an operator. Patches `TyneqEnumerableBase.prototype` immediately.
     *
     * @remarks
     * Registration order:
     * 1. Duplicate-name check — throws if `name` is already registered.
     * 2. Guards run in insertion order — any guard may throw to block.
     * 3. Entry stored in internal Map.
     * 4. `TyneqEnumerableBase.prototype[name]` patched with `impl`.
     * 5. Post-registration hooks fire in insertion order.
     *
     * @param entry - The operator entry to register.
     *
     * @throws {Error} When `entry.metadata.name` is already registered.
     * @throws {Error} When any registration guard throws.
     *
     * @group Registry
     */
    static register(input: OperatorEntryInput): void {
        const entry: OperatorEntry = {
            metadata: { source: 'internal', ...input.metadata } as OperatorMetadata,
            impl: input.impl,
        };
        const { name } = entry.metadata;

        if (this._entries.has(name)) {
            const existing = this._entries.get(name)!.metadata;
            throw new Error(
                `[tyneq] Cannot register '${name}' (${entry.metadata.kind}): ` +
                `already registered as '${existing.kind}' from source '${existing.source}'.`
            );
        }

        for (const guard of this._registrationGuards) {
            guard(entry);
        }

        this._entries.set(name, entry);
        (TyneqEnumerableBase.prototype as unknown as Record<string, unknown>)[name] = entry.impl;

        for (const hook of this._registrationHooks) {
            hook(entry);
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
    static unregister(name: string): boolean {
        if (!this._entries.has(name)) return false;
        this._entries.delete(name);
        delete (TyneqEnumerableBase.prototype as unknown as Record<string, unknown>)[name];
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
    static onRegister(hook: (entry: OperatorEntry) => void): () => void {
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
     *
     * @example
     * ```ts
     * // Enforce camelCase naming convention
     * OperatorRegistry.addGuard(entry => {
     *     if (!/^[a-z][a-zA-Z0-9]*$/.test(entry.metadata.name)) {
     *         throw new Error(`Operator name '${entry.metadata.name}' must be camelCase`);
     *     }
     * });
     * ```
     *
     * @group Registry
     */
    static addGuard(guard: (entry: OperatorEntry) => void): void {
        this._registrationGuards.push(guard);
    }

    // ── Introspection ─────────────────────────────────────────────────────────

    /**
     * Returns `true` if an operator with the given name is registered.
     *
     * @param name - The operator name to look up.
     *
     * @group Registry
     */
    static has(name: string): boolean {
        return this._entries.has(name);
    }

    /**
     * Returns the metadata for a registered operator, or `undefined` if not found.
     *
     * @param name - The operator name to look up.
     *
     * @group Registry
     */
    static get(name: string): OperatorMetadata | undefined {
        return this._entries.get(name)?.metadata;
    }

    /**
     * Returns a snapshot of all registered operator metadata, in registration order.
     *
     * @group Registry
     */
    static list(): readonly OperatorMetadata[] {
        return [...this._entries.values()].map(e => e.metadata);
    }

    /**
     * Returns a snapshot of operator metadata filtered by kind.
     *
     * @param kind - The operator kind to filter by.
     *
     * @group Registry
     */
    static listByKind(kind: OperatorMetadata['kind']): readonly OperatorMetadata[] {
        return this.list().filter(m => m.kind === kind);
    }

    /**
     * Returns the total number of registered operators.
     *
     * @group Registry
     */
    static count(): number {
        return this._entries.size;
    }
}
