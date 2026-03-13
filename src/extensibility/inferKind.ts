import { TyneqEnumerator } from '../core/enumerators/TyneqEnumerator';
import { TyneqEnumerableEnumerator } from '../core/enumerators/TyneqEnumerableEnumerator';

// ─────────────────────────────────────────────────────────────────────────────
// inferOperatorKind — derive 'streaming' | 'buffer' from a class's prototype chain
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Infers whether a class-based operator is `'streaming'` or `'buffer'` by walking
 * its prototype chain.
 *
 * @remarks
 * Used internally by the `@operator` decorator so callers do not need to pass `kind`
 * explicitly. Returns `'streaming'` if the chain contains `TyneqEnumerator.prototype`,
 * `'buffer'` if it contains `TyneqEnumerableEnumerator.prototype`, or throws if neither
 * is found.
 *
 * @param target - The enumerator class constructor to inspect.
 *
 * @returns `'streaming'` or `'buffer'`.
 *
 * @throws {Error} If the class does not extend `TyneqEnumerator` or `TyneqEnumerableEnumerator`.
 *
 * @group Registry
 * @internal
 */
export function inferOperatorKind(target: Function): 'streaming' | 'buffer' {
    let proto = Object.getPrototypeOf(target.prototype);
    while (proto !== null) {
        if (proto === TyneqEnumerator.prototype)           return 'streaming';
        if (proto === TyneqEnumerableEnumerator.prototype) return 'buffer';
        proto = Object.getPrototypeOf(proto);
    }
    
    throw new Error(
        `[tyneq] @operator('${target.name ?? '?'}'): ` +
        `cannot infer kind — class must extend TyneqEnumerator (streaming) ` +
        `or TyneqEnumerableEnumerator (buffer).`
    );
}
