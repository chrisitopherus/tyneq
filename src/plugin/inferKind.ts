import { TyneqEnumerator } from "../core/enumerators/TyneqEnumerator";
import { PluginError } from "../core/errors/PluginError";

/**
 * Infers `"streaming"` or `"buffer"` from a class's prototype chain.
 * Returns `"streaming"` when the class (or any ancestor) extends `TyneqEnumerator`.
 *
 * @throws {Error} When kind cannot be inferred and must be passed explicitly to `@operator`.
 *
 * @internal
 */
export function inferOperatorKind(target: Function): "streaming" | "buffer" {
    let proto = Object.getPrototypeOf(target.prototype);
    while (proto !== null) {
        if (proto === TyneqEnumerator.prototype) return "streaming";

        proto = Object.getPrototypeOf(proto);
    }

    throw new PluginError(
        `@operator("${target.name ?? "?"}"): cannot infer operator kind. ` +
        "The class must extend TyneqEnumerator for automatic kind inference. " +
        `Pass the kind explicitly instead: @operator("${target.name ?? "?"}", "streaming" | "buffer").`,
        "operator",
        target.name ?? undefined
    );
}
