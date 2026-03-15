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
 * ### Streaming operators
 * | Name              | Registration pattern        | Source file                             |
 * |-------------------|-----------------------------|-----------------------------------------|
 * | `where`           | `@operator` decorator       | `enumerators/streaming/where.ts`        |
 * | `select`          | `@operator` decorator       | `enumerators/streaming/select.ts`       |
 * | `scan`            | `@operator` decorator       | `enumerators/streaming/scan.ts`         |
 * | `window`          | `createOperator()`          | `operators/streaming/window.ts`         |
 * | `intersperse`     | `createGeneratorOperator()` | `operators/streaming/intersperse.ts`    |
 * | `defaultIfEmpty`  | `createGeneratorOperator()` | `operators/streaming/defaultIfEmpty.ts` |
 * | `append`          | `@operator` decorator       | `enumerators/streaming/append.ts`       |
 * | `chunk`           | `@operator` decorator       | `enumerators/streaming/chunk.ts`        |
 * | `concat`          | `@operator` decorator       | `enumerators/streaming/concat.ts`       |
 * | `pairwise`        | `@operator` decorator       | `enumerators/streaming/pairwise.ts`     |
 * | `populate`        | `@operator` decorator       | `enumerators/streaming/populate.ts`     |
 * | `prepend`         | `@operator` decorator       | `enumerators/streaming/prepend.ts`      |
 * | `selectMany`      | `@operator` decorator       | `enumerators/streaming/selectMany.ts`   |
 * | `skip`            | `@operator` decorator       | `enumerators/streaming/skip.ts`         |
 * | `skipLast`        | `@operator` decorator       | `enumerators/streaming/skipLast.ts`     |
 * | `skipWhile`       | `@operator` decorator       | `enumerators/streaming/skipWhile.ts`    |
 * | `split`           | `@operator` decorator       | `enumerators/streaming/split.ts`        |
 * | `take`            | `@operator` decorator       | `enumerators/streaming/take.ts`         |
 * | `takeWhile`       | `@operator` decorator       | `enumerators/streaming/takeWhile.ts`    |
 * | `tap`             | `@operator` decorator       | `enumerators/streaming/tap.ts`          |
 * | `tapIf`           | `@operator` decorator       | `enumerators/streaming/tapIf.ts`        |
 * | `throttle`        | `@operator` decorator       | `enumerators/streaming/throttle.ts`     |
 * | `zip`             | `@operator` decorator       | `enumerators/streaming/zip.ts`          |
 *
 * ### Buffer operators
 * | Name           | Registration pattern        | Source file                             |
 * |----------------|-----------------------------|-----------------------------------------|
 * | `backsert`     | `@operator` decorator       | `enumerators/buffer/backsert.ts`        |
 * | `distinct`     | `@operator` decorator       | `enumerators/buffer/distinct.ts`        |
 * | `distinctBy`   | `@operator` decorator       | `enumerators/buffer/distinctBy.ts`      |
 * | `except`       | `@operator` decorator       | `enumerators/buffer/except.ts`          |
 * | `exceptBy`     | `@operator` decorator       | `enumerators/buffer/exceptBy.ts`        |
 * | `groupBy`      | `@operator` decorator       | `enumerators/buffer/groupBy.ts`         |
 * | `groupJoin`    | `@operator` decorator       | `enumerators/buffer/groupJoin.ts`       |
 * | `intersect`    | `@operator` decorator       | `enumerators/buffer/intersect.ts`       |
 * | `intersectBy`  | `@operator` decorator       | `enumerators/buffer/intersectBy.ts`     |
 * | `join`         | `@operator` decorator       | `enumerators/buffer/join.ts`            |
 * | `reverse`      | `@operator` decorator       | `enumerators/buffer/reverse.ts`         |
 * | `shuffle`      | `@operator` decorator       | `enumerators/buffer/shuffle.ts`         |
 * | `union`        | `@operator` decorator       | `enumerators/buffer/union.ts`           |
 * | `unionBy`      | `@operator` decorator       | `enumerators/buffer/unionBy.ts`         |
 *
 * ### Terminal operators
 * | Name                   | Registration pattern  | Source file                                  |
 * |------------------------|-----------------------|----------------------------------------------|
 * | `aggregate`            | `@terminal` decorator | `operators/terminal/aggregate.ts`            |
 * | `all`                  | `@terminal` decorator | `operators/terminal/all.ts`                  |
 * | `any`                  | `@terminal` decorator | `operators/terminal/any.ts`                  |
 * | `average`              | `@terminal` decorator | `operators/terminal/average.ts`              |
 * | `consume`              | `@terminal` decorator | `operators/terminal/consume.ts`              |
 * | `contains`             | `@terminal` decorator | `operators/terminal/contains.ts`             |
 * | `count`                | `@terminal` decorator | `operators/terminal/count.ts`                |
 * | `countBy`              | `@terminal` decorator | `operators/terminal/countBy.ts`              |
 * | `elementAt`            | `@terminal` decorator | `operators/terminal/elementAt.ts`            |
 * | `elementAtOrDefault`   | `@terminal` decorator | `operators/terminal/elementAtOrDefault.ts`   |
 * | `first`                | `@terminal` decorator | `operators/terminal/first.ts`                |
 * | `firstOrDefault`       | `@terminal` decorator | `operators/terminal/firstOrDefault.ts`       |
 * | `indexOf`              | `@terminal` decorator | `operators/terminal/indexOf.ts`              |
 * | `isNullOrEmpty`        | `@terminal` decorator | `operators/terminal/isNullOrEmpty.ts`        |
 * | `last`                 | `@terminal` decorator | `operators/terminal/last.ts`                 |
 * | `lastOrDefault`        | `@terminal` decorator | `operators/terminal/lastOrDefault.ts`        |
 * | `max`                  | `@terminal` decorator | `operators/terminal/max.ts`                  |
 * | `maxBy`                | `@terminal` decorator | `operators/terminal/maxBy.ts`                |
 * | `min`                  | `@terminal` decorator | `operators/terminal/min.ts`                  |
 * | `minBy`                | `@terminal` decorator | `operators/terminal/minBy.ts`                |
 * | `minMax`               | `@terminal` decorator | `operators/terminal/minMax.ts`               |
 * | `sequenceEqual`        | `@terminal` decorator | `operators/terminal/sequenceEqual.ts`        |
 * | `single`               | `@terminal` decorator | `operators/terminal/single.ts`               |
 * | `singleOrDefault`      | `@terminal` decorator | `operators/terminal/singleOrDefault.ts`      |
 * | `startsWith`           | `@terminal` decorator | `operators/terminal/startsWith.ts`           |
 * | `sum`                  | `@terminal` decorator | `operators/terminal/sum.ts`                  |
 * | `toArray`              | `@terminal` decorator | `operators/terminal/toArray.ts`              |
 * | `toMap`                | `@terminal` decorator | `operators/terminal/toMap.ts`                |
 * | `toRecord`             | `@terminal` decorator | `operators/terminal/toRecord.ts`             |
 * | `toSet`                | `@terminal` decorator | `operators/terminal/toSet.ts`                |
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

// ── Streaming operators ────────────────────────────────────────────────────────

// @operator('where') — operator class
import '../streaming/where';

// @operator('select') — operator class
import '../streaming/select';

// @operator('scan') — operator class
import '../streaming/scan';

// createOperator('window') — functional API with generator (no enumerator class)
import '../streaming/window';

// createGeneratorOperator('intersperse') — generator shorthand (no enumerator class)
import '../streaming/intersperse';

// createGeneratorOperator('defaultIfEmpty') — generator shorthand (no enumerator class)
import '../streaming/defaultIfEmpty';

// @operator('append') — operator class
import '../streaming/append';

// @operator('chunk') — operator class
import '../streaming/chunk';

// @operator('concat') — operator class
import '../streaming/concat';

// @operator('pairwise') — operator class
import '../streaming/pairwise';

// @operator('populate') — operator class
import '../streaming/populate';

// @operator('prepend') — operator class
import '../streaming/prepend';

// @operator('selectMany') — operator class
import '../streaming/selectMany';

// @operator('skip') — operator class
import '../streaming/skip';

// @operator('skipLast') — operator class
import '../streaming/skipLast';

// @operator('skipWhile') — operator class
import '../streaming/skipWhile';

// @operator('split') — operator class
import '../streaming/split';

// @operator('take') — operator class
import '../streaming/take';

// @operator('takeWhile') — operator class
import '../streaming/takeWhile';

// @operator('tap') — operator class
import '../streaming/tap';

// @operator('tapIf') — operator class
import '../streaming/tapIf';

// @operator('throttle') — operator class
import '../streaming/throttle';

// @operator('zip') — operator class
import '../streaming/zip';

// ── Buffer operators ──────────────────────────────────────────────────────────

// @operator('backsert') — operator class
import '../buffer/backsert';

// @operator('distinct') — operator class
import '../buffer/distinct';

// @operator('distinctBy') — operator class
import '../buffer/distinctBy';

// @operator('except') — operator class
import '../buffer/except';

// @operator('exceptBy') — operator class
import '../buffer/exceptBy';

// @operator('groupBy') — operator class
import '../buffer/groupBy';

// @operator('groupJoin') — operator class
import '../buffer/groupJoin';

// @operator('intersect') — operator class
import '../buffer/intersect';

// @operator('intersectBy') — operator class
import '../buffer/intersectBy';

// @operator('join') — operator class
import '../buffer/join';

// @operator('reverse') — operator class
import '../buffer/reverse';

// @operator('shuffle') — operator class
import '../buffer/shuffle';

// @operator('union') — operator class
import '../buffer/union';

// @operator('unionBy') — operator class
import '../buffer/unionBy';

// ── Terminal operators ────────────────────────────────────────────────────────

// @terminal('aggregate') — class decorator, extends TyneqTerminalOperator
import '../terminal/aggregate';

// @terminal('all') — class decorator, extends TyneqTerminalOperator
import '../terminal/all';

// @terminal('any') — class decorator, extends TyneqTerminalOperator
import '../terminal/any';

// @terminal('average') — class decorator, extends TyneqTerminalOperator
import '../terminal/average';

// @terminal('consume') — class decorator, extends TyneqTerminalOperator
import '../terminal/consume';

// @terminal('contains') — class decorator, extends TyneqTerminalOperator
import '../terminal/contains';

// @terminal('count') — class decorator, extends TyneqTerminalOperator
import '../terminal/count';

// @terminal('countBy') — class decorator, extends TyneqTerminalOperator
import '../terminal/countBy';

// @terminal('elementAt') — class decorator, extends TyneqTerminalOperator
import '../terminal/elementAt';

// @terminal('elementAtOrDefault') — class decorator, extends TyneqTerminalOperator
import '../terminal/elementAtOrDefault';

// @terminal('first') — class decorator, extends TyneqTerminalOperator
import '../terminal/first';

// @terminal('firstOrDefault') — class decorator, extends TyneqTerminalOperator
import '../terminal/firstOrDefault';

// @terminal('indexOf') — class decorator, extends TyneqTerminalOperator
import '../terminal/indexOf';

// @terminal('isNullOrEmpty') — class decorator, extends TyneqTerminalOperator
import '../terminal/isNullOrEmpty';

// @terminal('last') — class decorator, extends TyneqTerminalOperator
import '../terminal/last';

// @terminal('lastOrDefault') — class decorator, extends TyneqTerminalOperator
import '../terminal/lastOrDefault';

// @terminal('max') — class decorator, extends TyneqTerminalOperator
import '../terminal/max';

// @terminal('maxBy') — class decorator, extends TyneqTerminalOperator
import '../terminal/maxBy';

// @terminal('min') — class decorator, extends TyneqTerminalOperator
import '../terminal/min';

// @terminal('minBy') — class decorator, extends TyneqTerminalOperator
import '../terminal/minBy';

// @terminal('minMax') — class decorator, extends TyneqTerminalOperator
import '../terminal/minMax';

// @terminal('sequenceEqual') — class decorator, extends TyneqTerminalOperator
import '../terminal/sequenceEqual';

// @terminal('single') — class decorator, extends TyneqTerminalOperator
import '../terminal/single';

// @terminal('singleOrDefault') — class decorator, extends TyneqTerminalOperator
import '../terminal/singleOrDefault';

// @terminal('startsWith') — class decorator, extends TyneqTerminalOperator
import '../terminal/startsWith';

// @terminal('sum') — class decorator, extends TyneqTerminalOperator
import '../terminal/sum';

// @terminal('toArray') — class decorator, extends TyneqTerminalOperator
import '../terminal/toArray';

// @terminal('toMap') — class decorator, extends TyneqTerminalOperator
import '../terminal/toMap';

// @terminal('toRecord') — class decorator, extends TyneqTerminalOperator
import '../terminal/toRecord';

// @terminal('toSet') — class decorator, extends TyneqTerminalOperator
import '../terminal/toSet';

// ── Re-exports (types needed by callers) ─────────────────────────────────────

export type { MinMaxResult } from '../terminal/minMax';
