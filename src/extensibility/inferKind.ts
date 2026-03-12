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
 * Used internally by the `@operator` decorator so that callers do not need to
 * pass `kind` explicitly. The rules are:
 *
 * - If any prototype in the chain is `TyneqEnumerator.prototype`, the class is
 *   a **streaming** operator.
 * - If any prototype in the chain is `TyneqEnumerableEnumerator.prototype`, the
 *   class is a **buffer** operator.
 * - If neither is found, an error is thrown guiding the author to use the correct
 *   base class.
 *
 * @param target - The enumerator class constructor to inspect.
 * @returns `'streaming'` or `'buffer'`.
 *
 * @throws {Error} When the class does not extend `TyneqEnumerator` or
 *   `TyneqEnumerableEnumerator`.
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
