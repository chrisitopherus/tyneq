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
 * | `append`       | Streaming | `@operator` decorator       | `operators/streaming/append.ts`     |
 * | `chunk`        | Streaming | `@operator` decorator       | `operators/streaming/chunk.ts`      |
 * | `concat`       | Streaming | `@operator` decorator       | `operators/streaming/concat.ts`     |
 * | `pairwise`     | Streaming | `@operator` decorator       | `operators/streaming/pairwise.ts`   |
 * | `prepend`      | Streaming | `@operator` decorator       | `operators/streaming/prepend.ts`    |
 * | `selectMany`   | Streaming | `@operator` decorator       | `operators/streaming/selectMany.ts` |
 * | `skip`         | Streaming | `@operator` decorator       | `operators/streaming/skip.ts`       |
 * | `skipLast`     | Streaming | `@operator` decorator       | `operators/streaming/skipLast.ts`   |
 * | `skipWhile`    | Streaming | `@operator` decorator       | `operators/streaming/skipWhile.ts`  |
 * | `split`        | Streaming | `@operator` decorator       | `operators/streaming/split.ts`      |
 * | `take`         | Streaming | `@operator` decorator       | `operators/streaming/take.ts`       |
 * | `takeWhile`    | Streaming | `@operator` decorator       | `operators/streaming/takeWhile.ts`  |
 * | `tap`          | Streaming | `@operator` decorator       | `operators/streaming/tap.ts`        |
 * | `tapIf`        | Streaming | `@operator` decorator       | `operators/streaming/tapIf.ts`      |
 * | `throttle`     | Streaming | `@operator` decorator       | `operators/streaming/throttle.ts`   |
 * | `zip`          | Streaming | `@operator` decorator       | `operators/streaming/zip.ts`        |
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
 *
 * @internal
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

// ── Migrated streaming operators (class decorator) ────────────────────────────

// @operator('append') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/append';

// @operator('chunk') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/chunk';

// @operator('concat') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/concat';

// @operator('pairwise') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/pairwise';

// @operator('prepend') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/prepend';

// @operator('selectMany') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/selectMany';

// @operator('skip') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/skip';

// @operator('skipLast') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/skipLast';

// @operator('skipWhile') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/skipWhile';

// @operator('split') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/split';

// @operator('take') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/take';

// @operator('takeWhile') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/takeWhile';

// @operator('tap') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/tap';

// @operator('tapIf') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/tapIf';

// @operator('throttle') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/throttle';

// @operator('zip') — class decorator, extends TyneqOperatorEnumerable
import '../streaming/zip';

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
