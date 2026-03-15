/**
 * @module extensibility
 *
 * Public API for extending Tyneq with custom operators.
 *
 * ## Registration mechanisms — pick what fits:
 *
 * | Mechanism                   | When to use                                          | Requires |
 * |-----------------------------|------------------------------------------------------|----------|
 * | `@operator(name)`           | Class-based streaming/buffer operator (library grade)| TS 5.0+  |
 * | `@terminal(name)`           | Class-based terminal operator (library grade)         | TS 5.0+  |
 * | `createOperator(config)`    | Functional streaming/buffer, custom factory          | None     |
 * | `createGeneratorOperator()` | Functional streaming, generator shorthand            | None     |
 * | `createTerminalOperator()`  | Functional terminal                                  | None     |
 * | `.pipe(factory)`            | One-off inline transform, no registration at all     | None     |
 *
 * ## Type augmentation
 *
 * Runtime registration alone does not teach TypeScript about the new method.
 * External developers must always add a `declare module 'tyneq'` block:
 *
 * ```ts
 * // my-operators/scan.ts
 * import { createGeneratorOperator } from 'tyneq/extensibility';
 *
 * createGeneratorOperator({ name: 'scan', *generator(source, seed, acc) { ... } });
 *
 * declare module 'tyneq' {
 *     interface ITyneqEnumerable<TSource> {
 *         scan<TAcc>(seed: TAcc, acc: (a: TAcc, item: TSource) => TAcc): ITyneqEnumerable<TAcc>;
 *     }
 * }
 * ```
 *
 * For library-provided operators, type signatures are declared directly on
 * `ITyneqEnumerable` in `src/types/core.ts`.
 */
export { operator } from "./operator";
export { terminal } from "./terminal";
export { createOperator } from "./createOperator";
export { createGeneratorOperator } from "./createGeneratorOperator";
export { createTerminalOperator } from "./createTerminalOperator";
export { OperatorRegistry } from "./OperatorRegistry";
export type { OperatorMetadata, OperatorEntry, OperatorEntryInput } from "./OperatorRegistry";
