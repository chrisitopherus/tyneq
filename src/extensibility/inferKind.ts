import { TyneqEnumerator } from "../core/enumerators/TyneqEnumerator";
import { TyneqEnumerableEnumerator } from "../core/enumerators/TyneqEnumerableEnumerator";

// ─────────────────────────────────────────────────────────────────────────────
// inferOperatorKind — derive 'streaming' | 'buffer' from a class's prototype chain
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fallback kind inference for the `@operator` decorator.
 *
 * @remarks
 * Called only when `kind` is not passed explicitly to `@operator`. Walks the prototype
 * chain looking for `TyneqEnumerator.prototype` (→ `'streaming'`) or the deprecated
 * `TyneqEnumerableEnumerator.prototype` (→ `'buffer'`).
 *
 * **In practice this function always returns `'streaming'` today.** All current operators
 * extend `TyneqEnumerator` regardless of whether they are streaming or buffer operators.
 * Buffer kind cannot be inferred from the prototype chain because both kinds share the same
 * base class — it must be passed explicitly: `@operator('reverse', 'buffer')`.
 *
 * The `TyneqEnumerableEnumerator` branch exists for backward compatibility only; that class
 * is deprecated and no built-in operator extends it.
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
export function inferOperatorKind(target: Function): "streaming" | "buffer" {
    let proto = Object.getPrototypeOf(target.prototype);
    while (proto !== null) {
        if (proto === TyneqEnumerator.prototype)           return "streaming";
        if (proto === TyneqEnumerableEnumerator.prototype) return "buffer";
        proto = Object.getPrototypeOf(proto);
    }

    throw new Error(
        `[tyneq] @operator('${target.name ?? "?"}'): ` +
        "cannot infer kind — class must extend TyneqEnumerator, " +
        `or pass kind explicitly: @operator('${target.name ?? "?"}', 'streaming' | 'buffer').`
    );
}
