/**
 * @module operators/extensions
 *
 * Barrel module that registers **all** operators on `TyneqEnumerableBase.prototype`
 * via side-effect imports.
 *
 * ## How this barrel works
 *
 * Each imported file registers its operator as a **module-level side effect**:
 *
 * - Files using `@operator()` / `@terminal()` decorators: registration fires when
 *   the class body is evaluated (decorator runs at class definition time).
 * - Files using `createOperator()` / `createGeneratorOperator()`: registration fires
 *   when the top-level call is executed (module evaluation time).
 *
 * Importing **this barrel** (or the individual files) is all that's needed —
 * no manual wiring in `TyneqEnumerableBase` is required.
 *
 * ## Usage
 *
 * ```ts
 * // Consumers just import from the main entry point:
 * import { Tyneq } from 'tyneq';
 *
 * // All operators are available — no additional imports needed:
 * Tyneq.from([1, 2, 3]).where(x => x > 1).select(x => x * 2).toArray();
 * ```
 *
 * ## Operator registry
 *
 * | Name           | Category  | Registration pattern        | Source file                         |
 * |----------------|-----------|-----------------------------|-------------------------------------|
 * | `where`        | Streaming | `@operator` decorator       | `operators/streaming/where.ts`      |
 * | `select`       | Streaming | `createGeneratorOperator()` | `operators/streaming/select.ts`     |
 * | `scan`         | Streaming | `@operator` decorator       | `operators/streaming/scan.ts`       |
 * | `window`       | Streaming | `createOperator()`          | `operators/streaming/window.ts`     |
 * | `intersperse`  | Streaming | `createGeneratorOperator()` | `operators/streaming/intersperse.ts`|
 * | `distinct`     | Buffer    | `createOperator()`          | `operators/buffer/distinct.ts`      |
 * | `toArray`      | Terminal  | `@terminal` decorator       | `operators/terminal/toArray.ts`     |
 * | `minMax`       | Terminal  | `@terminal` decorator       | `operators/terminal/minMax.ts`      |
 *
 * ## Adding a new operator
 *
 * 1. Create your operator file in `src/operators/streaming/`, `buffer/`, or `terminal/`.
 * 2. Use `@operator('name')` / `@terminal('name')` on your class, or call
 *    `createOperator()` / `createGeneratorOperator()` / `createTerminalOperator()` at module level.
 * 3. Add the method signature to `ITyneqEnumerable` in `src/types/core.ts`.
 * 4. Add an `import` line below — that's everything.
 */

// ── Core streaming operators ──────────────────────────────────────────────────

// @operator('where') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/where';

// createGeneratorOperator('select') — generator shorthand
import '../streaming/select';

// @operator('scan') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/scan';

// createOperator('window') — functional API, custom IEnumeratorFactory
import '../streaming/window';

// createGeneratorOperator('intersperse') — generator shorthand, lowest ceremony
import '../streaming/intersperse';

// ── Core buffer operators ─────────────────────────────────────────────────────

// createOperator('distinct') — functional API wrapping class-based enumerator
import '../buffer/distinct';

// ── Core terminal operators ───────────────────────────────────────────────────

// @terminal('toArray') — class decorator, extends TyneqTerminalOperator
import '../terminal/toArray';

// @terminal('minMax') — class decorator, extends TyneqTerminalOperator
import '../terminal/minMax';

// ── Re-exports (types needed by callers) ─────────────────────────────────────

export type { MinMaxResult } from '../terminal/minMax';
