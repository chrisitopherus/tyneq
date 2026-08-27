# Tyneq - Deep-Dive Technical Audit

Date: 2026-07-13
Scope: full source (`src/`), test suite (`tests/`), built output (`dist/`), build/tooling config, README.
Method: systematic source reading of all core machinery, the query plan system, both plugin APIs, and a representative majority of the 80+ operators; the test suite read as a spec; plus **25 empirical repro checks executed against `src` with tsx** (results quoted inline as CHECK-N). All 1151 existing tests pass; line coverage is 96.5%.

Severity scale: Critical / High / Medium / Low / Nitpick. Findings are numbered F1..F27 and cross-referenced from the executive summary.

---

## 1. Executive summary

Ranked by impact on the library's four stated pillars (deferred/re-iterable model, streaming/buffering boundary, plugin API, query plan soundness):

1. **[F1, High/Critical]** An exception thrown by any user callback mid-iteration bypasses the entire disposal state machine: the upstream enumerator is never disposed, and worse, the failed enumerator is *resumable* - calling `next()` again continues iteration as if nothing happened, silently skipping the failing element. Verified empirically.
2. **[F2, High]** `memoize()` converts an upstream error into a silently truncated sequence: after a mid-source throw, subsequent iterations replay the partial cache as if it were the complete, successful result. Verified empirically.
3. **[F3, High]** The re-iterability contract - the library's headline promise - is silently voided by any one-shot iterable, both as source (`Tyneq.from(generatorObject)`) and as operator argument (`zip`, `concat`, `except`, ...). The second pass yields `[]` with no error, while the README explicitly advertises generators as supported sources. Verified empirically.
4. **[F4, High]** The streaming/buffering taxonomy - "no guessing about when data gets copied" - is misdescribed in both directions: `distinct`/`except`/`join` are labeled buffering but actually stream (verified on an infinite source), while `split`/`window`/`chunk`/`skipLast` are labeled "Streaming (O(1) memory)" but buffer O(size) or, for `split`, potentially the entire source.
5. **[F5, High]** `@operator`/`@terminal` reject any enumerator class whose `handleNext`/`process` is inherited from an intermediate base class - a false-positive `PluginError` that blocks legitimate plugin class hierarchies. Verified empirically.
6. **[F6, Medium]** `QueryPlanCompiler`'s `options.source` blindly replaces `args[0]` of *any* source node; replaying a `range` plan with a substituted source dies with a bare `RangeError: Invalid array length` from inside `range`. Verified empirically.
7. **[F7, Medium]** The `QueryPlanOptimizer` documentation asserts that where-fusion changes side-effect behavior. Empirically it does not - the fused and unfused pipelines produce byte-identical call sequences in the pull model. The optimizer is sounder than its own docs claim, and the false warning will scare users away from the feature.
8. **[F8, Medium]** Systematic copy-paste documentation drift: 17 buffer enumerators carry the same (often false) "Source is fully buffered" remark; 26 terminal operators carry "Source is fully enumerated when this method is called" including short-circuiting ones (`first`, `any`); the README's flagship examples (`active.first()`, `query.first()`) do not compile against the actual required-predicate signature.
9. **[F9, Medium]** The `tyneq` main barrel re-exports the entire plugin API plus internal types (`SequenceFactory`, `OperatorEntry`, `Assume`, `Cast`, ...), making the three-subpath package boundary cosmetic and the effective semver surface much larger than the stated contract.
10. **[F10, Medium]** ESLint enforces style only - not a single correctness or type-aware rule is enabled. Combined with `tsconfig` lacking `noUncheckedIndexedAccess`, the tooling would not have caught several of the issues above.

What is genuinely good (kept brief): the enumerator lifecycle state machine is a clean design (aside from the throw path), the multi-key sorter is correctly stable and matches .NET's orderBy-resets-ordering semantics (verified live-vs-compiled equivalence, CHECK11/22), `permutations` uses iterative Heap's algorithm, custom operators genuinely appear in query plans and recompile correctly (CHECK17), duplicate registration is guarded at runtime with a good error (CHECK18), generator-operator cleanup via `finally` works on early termination (CHECK19), interleaved iterators over one memoized sequence share the cache correctly (CHECK25), and raw line coverage is high.

---

## 2. Findings by category

### A. Performance

---

#### F11 - `BaseEnumerableSorter.sort` copies the source array for no reason
- **Severity:** Medium
- **Location:** `src/core/ordering/BaseEnumerableSorter.ts:25`
- **Problem:** Every iteration of every ordered sequence allocates a full copy of the buffered source purely to pass to `computeKeys`, which only reads it. `OrderByEnumerator.initialize` has already materialized the buffer (`Array.from(...)`), so sorting an n-element sequence allocates 2n slots plus the index map where n + map would do. On re-iteration this repeats in full.
- **Evidence:**
  ```ts
  public sort(source: TSource[], count: number): number[] {
      this.computeKeys([...source], count);   // defensive copy, never mutated
  ```
  `computeKeys` implementations only index into the array.
- **Recommendation:** `this.computeKeys(source, count);`. If the copy was meant to defend against key selectors mutating the array, that defense is illusory anyway - `compareKeys` and the final index lookup use the original `buffer`. Clean-code rule: do not pay for protection you do not get.
- **Risk/effort:** Trivial, non-breaking.

---

#### F12 - Re-iteration re-runs every buffering stage in full; the cost is real but under-documented
- **Severity:** Medium (documentation + guidance, not a bug)
- **Location:** `OrderByEnumerator`, all buffer enumerators; README "Same query, three independent evaluations" section
- **Problem:** The README example runs `count()`, `first()`, and `select().toArray()` against one query and celebrates "three independent evaluations". For a pipeline containing `orderBy`, that is three full buffer-and-sort passes (each with the F11 double allocation). The design decision (no hidden materialization) is correct and consistent with the library's philosophy - but the README presents re-execution as free, and nothing in the operator docs tells the user that `memoize()` is the intended escape hatch for exactly this pattern.
- **Recommendation:** In the README's re-iterability section, add one sentence: re-iterating re-executes the pipeline including buffering operators; insert `.memoize()` after expensive stages to pay once. This keeps the "no hidden materialization" promise while steering users correctly.
- **Risk/effort:** Docs only.

---

#### F13 - `memoize` concurrency-of-iteration is sound, but error and refresh states are not (see F2)
- **Severity:** Low (for the concurrency part; the error part is F2)
- **Location:** `src/core/TyneqCachedEnumerable.ts`
- **Evidence (positive):** CHECK25 - two interleaved enumerators over one memoized sequence produced `[1,1,2,2,3,3]` with exactly 3 upstream pulls. The shared-cursor design (`tryGetAtFromCache(index)` with per-enumerator index) is correct.
- **Problem (residual):** `refresh()` while an iterator is mid-flight makes that iterator silently replay from the start of the new cache: CHECK8 produced `[1, 2, 1, 2, 3, 4]` from a 4-element source. Not necessarily wrong, but it is an observable behavior nobody chose; an active `MemoizeEnumerator` holds only an integer index into a cache that was just emptied.
- **Recommendation:** Version the cache: `refresh()` increments a generation counter; live `MemoizeEnumerator`s capture the generation at creation and return `{ done: true }` (or throw `InvalidOperationError`, .NET-collection-modified style) when it changes. Either behavior is defensible; the current accidental replay is not.
- **Risk/effort:** Small, behavioral change in an edge case; safe before 1.0-freeze.

---

#### F14 - Minor allocation notes (grouped)
- **Severity:** Low / Nitpick
- **Location:** various
- `toMap`/`toRecord` selectors must allocate a `{ key, value }` object per element (`KeyValuePair`). A `[key, value]` tuple (matching the `Map` constructor convention) would allow selector reuse and is what JS developers expect. Breaking change - decide before freeze.
- `where`/`distinct`/`throttle` destructure `const { done, value } = ...next()` per element; fine, V8 handles it, not worth changing.
- The query plan retains a strong reference to the original source data forever (`new QueryNode("from", [source], ...)`). For "store a pipeline as metadata" workflows this pins the entire dataset in memory. Consider documenting, or offering a `detachSource()` transformer.
- **Risk/effort:** Tuple change is breaking; the rest is docs/none.

---

### B. Code quality and clean code

---

#### F8 - Systematic copy-paste doc drift across operator remarks and the README
- **Severity:** Medium (High in aggregate with F4 - it corrupts the library's central taxonomy)
- **Location:** all of `src/enumerators/buffer/*` (17 files), most of `src/operators/*` (26 files), `README.md:72`, `README.md:262`, `src/types/queryplan.ts` (`tyneqQueryNode` doc), `src/types/core.ts:1026`
- **Problem and evidence:**
  - 17 buffer enumerators share the sentence "Source is fully buffered on the first iteration of the returned sequence." For `DistinctEnumerator`, `ExceptEnumerator`, and the outer side of `JoinEnumerator` this is false (see F4). The sentence was clearly pasted, not derived.
  - 26 terminal operators share "Immediate. Source is fully enumerated when this method is called." `FirstOperator`, `AnyOperator`, `ContainsOperator` short-circuit; saying they fully enumerate is exactly the kind of claim a performance-conscious user relies on.
  - README line 72 and 262: `active.first().name` / `query.first(); // 4` - `first()` requires a predicate (`first(predicate: ItemPredicate<TSource>)`), so the flagship examples are compile errors.
  - `tyneqQueryNode` doc: "Sequences created via `pipe()` always have `null` here." CHECK9: a `pipe` sequence carries a live `pipe` node. The doc describes a previous design.
  - `TyneqCachedSequence.refresh()` doc: "returns a new `TyneqCachedSequence`" - the implementation returns `this` (`TyneqCachedEnumerable.refresh`).
  - `Enumerator` doc: "`throw()` is not supported and throws `NotSupportedError` if called." CHECK10: `throw` is simply absent; calling it is a `TypeError`, and `NotSupportedError` is exported but never thrown by anything on this path.
- **Recommendation:** Treat operator `@remarks` as per-operator specs, not boilerplate. Concretely: replace the shared sentence with one of three accurate templates ("streams; holds a seen-set of yielded elements", "buffers the full source on first pull", "buffers only the `other` argument; streams the source") and fix the six specific docs listed. Fix the README examples to `first((x) => true)` or - better - implement F19.
- **Risk/effort:** Docs only, zero runtime risk. High leverage: this is the documentation users will quote back at you.

---

#### F15 - Internal knowledge base (`tasks/lessons.md`) is stale on the plugin API it governs
- **Severity:** Medium (internal, but CLAUDE.md declares it authoritative)
- **Location:** `tasks/lessons.md` "OPERATOR AUTHORING" section
- **Problem:** LESSONS documents `@operator(name, kindOrValidate?, validate?)` with kind optional and a fallback to `inferOperatorKind` "which reads the prototype chain". In current source, `operator(name, category, validate?)` has a *required* category parameter and `inferOperatorKind` does not exist anywhere in `src/` (it survives only in `tasks/results.md` history). LESSONS also gives `@operator('pairwise')` as a valid example - today a compile error. Since the repo's agent workflow instructs "do not re-derive" from LESSONS, this drift actively produces wrong code.
- **Recommendation:** Update the LESSONS entries to the current two-arg-minimum signature; delete the `inferOperatorKind` rule; fix the `defaultIfEmpty` classification note (it is class-based now, `src/enumerators/streaming/defaultIfEmpty.ts`).
- **Risk/effort:** Docs only.

---

#### F16 - Inconsistent eager-validation coverage across sibling operators
- **Severity:** Low
- **Location:** `TyneqOrderedEnumerable.thenBy`/`thenByDescending`, `TyneqEnumerableBase.repeat`, `Tyneq.range`
- **Problem:** The validation contract says user-arg validation is eager at the call site. `orderBy` checks `checkNotOptional({ keySelector })` explicitly; `thenBy` does not - it relies on the constructor's infrastructure check, so `thenBy(undefined)` throws `ArgumentError` naming the parameter but via a different path and (per the repo's own rule) for the wrong reason. `repeat(count)` uses `checkInteger` where every sibling uses `checkSafeInteger`. `Tyneq.range(start, count)` never validates `start` at all - `range(NaN, 3)` builds a sequence that yields nothing (`NaN <= end` is false) instead of throwing.
- **Evidence:** CHECK24: `thenBy(undefined)` -> `ArgumentError` (constructor path); `where(null)` -> `ArgumentNullError`, `where(undefined)` -> `ArgumentError` (intentional split); `chunk(0)` -> `ArgumentOutOfRangeError`. The error taxonomy itself is good - the inconsistency is in who performs the check and which integer guard is used.
- **Recommendation:** Add the explicit `checkNotOptional({ keySelector })` to both `thenBy` variants; standardize on `checkSafeInteger`; validate `start` in `range` (`checkNumber`/finite at minimum). Principle: the validation contract in LESSONS is right - enforce it uniformly.
- **Risk/effort:** Trivial; strictly tightens behavior (new throws on previously silent garbage inputs) - acceptable pre-1.0-freeze, note in changelog.

---

#### F17 - Stray artifacts in core files
- **Severity:** Nitpick
- **Location:** `TyneqOrderedEnumerable.ts:169` (`undefined, // CREDITS: KOMINO`), `TyneqEnumerableBase.ts:119-121` (blank line splitting `@builtin` from `consume`), scattered double-blank lines and trailing-whitespace-indented blank lines in enumerator files (e.g. `distinct.ts:18`, `permutations.ts` end).
- **Recommendation:** Remove the in-joke comment (it reads as noise to any contributor), rejoin the decorator to `consume()`. Consider `eslint --fix` with `no-multiple-empty-lines`.
- **Risk/effort:** Zero.

---

### C. Architecture and design

---

#### F1 - Exceptions bypass the enumerator lifecycle: no disposal, no poisoning
- **Severity:** High (borderline Critical - it breaks both the resource contract and result correctness on error paths)
- **Location:** `src/core/enumerators/TyneqBaseEnumerator.ts:29-51` (`next()`)
- **Problem:** `next()` calls `this.handleNext()` with no try/catch. If a user callback (selector, predicate, comparer, key selector) throws:
  1. `dispose()` is never called, so the upstream `sourceEnumerator.return()` never fires. Any resource-backed source (file handle wrapper, DB cursor adapter, generator with `finally`) leaks. `for..of` does *not* call `return()` when `next()` itself throws - per spec, the iterator is responsible for its own state on throw.
  2. `_completed` stays false, so the enumerator is left in a resumable, corrupted state.
- **Evidence:** CHECK1: custom source with a `return()` spy; `.select(x => { if (x === 3) throw ... })` -> `upstream disposed: false`. CHECK2: after catching the throw from element 2, continuing to call `next()` yielded `[3, 4]` - the pipeline "recovered" by silently dropping the poisoned element. Both the streaming/buffering docs and `disposeAdditional`'s "must be idempotent" remark show disposal was designed carefully for the success and early-return paths, then forgotten for the throw path.
- **Recommendation:** Wrap the two callout sites in `next()`:
  ```ts
  public next(): IteratorResult<TOutput> {
      if (this._completed) return this.done();
      try {
          if (!this._initialized) { this.initialize(); this._initialized = true; }
          const result = this.handleNext();
          if (result.done) { ... }
          return result;
      } catch (error) {
          this._completed = true;
          this.dispose(error);   // dispose must not throw (already documented)
          throw error;
      }
  }
  ```
  This is the Template Method pattern doing its actual job: the base class owns the lifecycle invariant ("an enumerator that has thrown is dead and its resources are released"), so no subclass can get it wrong. Add tests: throwing selector disposes upstream; `next()` after throw returns `{ done: true }`.
- **Risk/effort:** Small, central, behavior-tightening. The only observable change is for code that deliberately resumed a thrown-through enumerator - which today produces wrong answers.

---

#### F2 - `memoize` caches partial state across an upstream error and replays it as truth
- **Severity:** High
- **Location:** `src/core/TyneqCachedEnumerable.ts:50-75` (`tryGetAtFromCache`)
- **Problem:** When `this.sourceEnumerator.next()` throws, the error propagates but `done` stays false, the partial cache stays, and `sourceEnumerator` stays set. On the next iteration the cache serves the prefix, then the (now dead) generator returns `{ done: true }`, so `done` flips to true and the truncated prefix is permanently certified as the complete sequence.
- **Evidence:** CHECK7: source yields 1, 2, then throws once. First `toArray()` threw "flaky"; second `toArray()` returned `[1, 2]` with no error and no re-pull of the source.
- **Recommendation:** On catch inside `tryGetAtFromCache` (wrap the `next()` call): reset `this.sourceEnumerator = null` and either (a) record the error and rethrow it for any index past the cached prefix until `refresh()` is called (error-caching, RxJS `shareReplay` semantics), or (b) clear the cache entirely so the next iteration retries the source from scratch. (a) is more honest for a cache; (b) is friendlier for flaky sources. Pick one, document it, test it. The current behavior - swallow and truncate - is the one option that is never right.
- **Risk/effort:** Small and contained; behavioral change only on error paths.

---

#### F3 - One-shot iterables silently break re-iterability at both ends of the pipeline
- **Severity:** High
- **Location:** `src/core/tyneq.ts:37` (`Tyneq.from`), `src/core/EnumerableAdapter.ts`, and every operator that stores an `Iterable` argument (`zip`, `concat`, `except`, `intersect`, `union`, `join`, `groupJoin`, `backsert`, `sequenceEqual`, ...)
- **Problem:** A generator object (and any iterator-as-iterable) satisfies `Iterable<T>` but yields exactly once. `Tyneq.from` even documents "arrays, sets, generators, etc." as supported. Every re-iteration after the first silently produces `[]` - no error, no warning. The same applies to iterable *arguments*: `ZipEnumerator` calls `other[Symbol.iterator]()` per fresh enumerator, which for a generator object returns the same exhausted iterator.
- **Evidence:** CHECK21: `Tyneq.from(gen())` -> first `[1,2]`, second `[]`. CHECK4: `seq.zip(gen(), ...)` -> first `["1a","2b","3c"]`, second `[]`.
- **Recommendation:** Detect the one-shot case at the adapter boundary - it is cheap and reliable:
  ```ts
  const isOneShot = (it: Iterable<unknown>): boolean => {
      const iter = it[Symbol.iterator]();
      return iter === (it as unknown); // generator objects return themselves
  };
  ```
  (Do this without consuming: compare `it[Symbol.iterator]() === it`, which is exactly the generator-object signature; also true for `Map.prototype.entries()` results etc.) Then pick a policy per the library's philosophy: either throw `ArgumentTypeError("source is a one-shot iterator; wrap it with Tyneq.from([...gen()]) or .memoize()")` on the *second* `getEnumerator()` call, or auto-wrap one-shot sources in the memoize cache (which arguably violates "no hidden materialization" - so throwing is more consistent with the brand). Silence is the only unacceptable option for a library whose comparison table's second row is "Re-iterable sequences: yes".
- **Risk/effort:** Medium. The detection is safe; the policy change can affect users who deliberately iterate once. Gate the error on the second enumeration to keep single-pass usage working unchanged.

---

#### F4 - The streaming/buffering classification is wrong in both directions
- **Severity:** High (it is the library's central taxonomy)
- **Location:** `@builtin({ kind: "buffer" })` annotations in `TyneqEnumerableBase.ts` (distinct, distinctBy, except, exceptBy, intersect, intersectBy, union, unionBy, join, groupJoin); README.md:290-296; per-file remarks (F8)
- **Problem:** The README defines the split as streaming = "O(1) memory, one element at a time" and buffering = "reads the full source once". Reality:
  - `distinct`, `distinctBy`, `union`, `unionBy` *stream* the source with a growing seen-set; they never read the full source unless the consumer does. CHECK3: `distinct().take(3)` on an infinite source returned `[0,1,2]` - a genuinely buffering operator would hang. This is better than advertised, and the correct classification matters: a user avoiding `distinct` on a large stream because the docs call it buffering is being misled.
  - `except`/`exceptBy`/`intersect`/`intersectBy` buffer only the *argument*, and stream the source.
  - `join`/`groupJoin` buffer only the inner sequence; the outer streams.
  - Conversely, in the "Streaming (O(1) memory)" README list: `window` and `chunk` hold O(size); `skipLast` holds O(count); `split` holds an unbounded segment - `from(bigArray).split(() => false)` buffers the entire source in one array while wearing the streaming label.
- **Recommendation:** The binary taxonomy is too coarse for what the library actually does, and the library is the one place that should get this exactly right. Either:
  1. Keep two categories but redefine them honestly: streaming = "memory bounded by operator parameters, source consumed incrementally"; buffering = "may hold O(source) elements". Under that definition `distinct` is buffering (seen-set is O(distinct elements)) and `window(3)` is streaming - and then fix `split`'s doc to state the unbounded-segment caveat.
  2. Better: add a third documented memory class per operator (`O(1)`, `O(k)` with the parameter named, `O(n)`), put it in `OperatorMetadata.extensions` (the field exists and is unused), and generate the README table from the registry so it cannot drift again.
  Option 2 turns a liability into a differentiator: no other library documents per-operator memory class, and you already have the registry to hang it on.
- **Risk/effort:** Docs plus metadata; no runtime change. Changing the `kind` strings on existing registrations is observable through `OperatorRegistry.listByKind` - do it before the 1.0 freeze.

---

#### F6 - `CompileOptions.source` blindly replaces `args[0]` of any source node
- **Severity:** Medium
- **Location:** `src/queryplan/compiler/QueryPlanCompiler.ts:161-163`
- **Problem:** `compileSource` does `[options.source, ...node.args.slice(1)]` regardless of which source operator the node names. Only `from` has an iterable as `args[0]`. For `range(start, count)` the substitution produces `range(iterable, count)`; for `random`, `repeat`, `generate` similar nonsense.
- **Evidence:** CHECK5: compiling a `range(1,5).select(...)` plan with `{ source: [10, 20] }` threw `RangeError: Invalid array length` from deep inside `RangeEnumerator` - no `CompilerError`, no mention of the actual mistake.
- **Recommendation:** Gate the substitution: only apply when `isSourceNode(node) && node.operatorName === "from"` (or, more extensibly, when the registered source entry opts in via metadata, e.g. `OperatorMetadata.extensions.acceptsSourceOverride === true`, so third-party `@source` factories can participate deliberately). Otherwise throw `CompilerError("options.source is not applicable to source operator \"range\"...")`. This is DIP done right: the compiler should ask the registry what the source supports instead of assuming a positional convention.
- **Risk/effort:** Small; strictly improves error quality. Also fix the `CompileOptions.source` JSDoc, which currently implies it works for any source node.

---

#### F7 - The optimizer's own documentation overstates its unsoundness (and undersells it)
- **Severity:** Medium (documentation of a core feature; the code itself is sound for the shipped fusions)
- **Location:** `src/queryplan/QueryPlanOptimizer.ts:14-19` class remarks
- **Problem:** The docs claim: "in a fused `where`, the second predicate is never called for items that fail the first - any mutation inside the second predicate is skipped for those items. Do not use this optimizer on pipelines with impure predicates." But in the unfused pull pipeline, `where(a).where(b)` *also* never calls `b` on items that fail `a` - they are filtered before `b`'s enumerator sees them. Fusion to `a(x) && b(x)` preserves call counts, call order, and interleaving exactly.
- **Evidence:** CHECK6: instrumented predicates, unfused vs optimizer-fused-then-recompiled, on `[1,2,3,4]`: both produced the identical trace `["a(1)","a(2)","b(2)","a(3)","a(4)","b(4)"]`.
- **Analysis of actual soundness (requested proof sketch):** In a single-consumer pull model, `where(a).where(b)` evaluates, per upstream element x in order: `a(x)`, then `b(x)` iff `a(x)` is truthy - which is precisely the evaluation rule of `a(x) && b(x)`. Exceptions propagate from the same call in the same position. Therefore where-fusion is behavior-preserving *including* for side-effecting predicates. Same argument for select-fusion `b(a(x))`: unfused, `a(x)` is computed and its result immediately passed through to `b` before the next upstream pull, identical to the composition. The one semantic caveat worth documenting instead: fused nodes lose their identity in the plan (two `<fn>` entries become one), so plan-diffing tools and `where`-node counts change; and any *future* fusion across a stateful operator (e.g. reordering around `tap`, or fusing across `skip`) would not enjoy this argument - the adjacency requirement is what makes it sound.
- **Recommendation:** Replace the warning paragraph with the correct statement: adjacent where/select fusion is behavior-preserving even for impure functions; the constraint to preserve when adding new rules is "never reorder or elide operators across a node boundary, only merge directly adjacent same-shape nodes". Add an equivalence property test (random pipelines, instrumented callbacks, assert identical traces and outputs) so future fusion rules are held to the proof, not the vibe.
- **Risk/effort:** Docs plus one test file.

---

#### F9 - The subpath boundaries are cosmetic: `tyneq` exports everything, including internals
- **Severity:** Medium
- **Location:** `src/index.ts` (`export * from "./types/core"`, all plugin decorators and factories, reflection API), `dist/index.d.ts:2`
- **Problem:** The package advertises three subpaths with distinct roles, and a semver contract that excludes internal classes. But:
  - `src/index.ts` re-exports the complete plugin API (`operator`, `createOperator`, all seven `create*` factories, all base enumerator classes). `tyneq/plugin` is therefore a strict subset of `tyneq` - the boundary communicates intent but enforces nothing, and the README itself imports `createGeneratorOperator` from `"tyneq"` (line 121), undercutting the story.
  - `export * from "./types/core"` leaks types documented as internal: `SequenceFactory` (the protected-access-bypass interface), `OperatorEntry`, `SequenceConstructor`, `TyneqEnumerableFactory`, plus `types/utility` internals (`Assume`, `Cast`, `WithProperties`, ...). Verified present in `dist/index.d.ts`. Anything a `.d.ts` exports is API someone will depend on; "@internal" JSDoc does not stop `import type { SequenceFactory } from "tyneq"`.
- **Recommendation:** Before the freeze: make `src/index.ts` export an explicit named list (you already do this for most sections - the two `export *` lines are the leak); drop the plugin re-exports from the root or accept that `tyneq/plugin` is purely organizational and say so in the docs. If you keep TypeDoc `@internal` stripping ambitions, add `"stripInternal"`-equivalent handling in the tsup dts step or move internal types to a non-exported module. Principle: ISP - consumers of the query API should not receive the plugin author surface.
- **Risk/effort:** Technically breaking for anyone importing internals from the root - which is exactly why to do it now, pre-1.0-freeze.

---

#### F18 - Registration side effects vs `sideEffects` field and tree-shaking posture
- **Severity:** Medium (latent, bundler-dependent)
- **Location:** `package.json` (`"sideEffects": ["./dist/index.js", "./dist/index.cjs"]`), `tsup.config.ts` (`splitting: true`)
- **Problem:** With code splitting, the decorator-driven registrations (`@sequence`/`@builtin` scans, `@source` on `Tyneq`) execute at module-evaluation time inside shared `chunk-*.js` files - which are *not* listed in `sideEffects` and are therefore declared pure. Today the dependency graph saves you: an esbuild bundle test (importing only `Tyneq`, bundling `dist`) retained all registrations and executed correctly. But the guarantee is structural luck, not declaration: a bundler is licensed to skip evaluating any chunk whose exports it can prove unused, and `plugin/index.js` (whose entire purpose for some users is side-effect registration ordering) is likewise declared pure. Separately: the same bundle test shows a single `where()` pipeline pulls in ~142 KB - all 80 operators, the query plan system, reflection, and the registry. That is inherent to prototype-patching plus a monolithic base class (the Registry pattern's known cost) and is a legitimate design trade-off, but it should be a stated one.
- **Recommendation:** List the side-effectful outputs honestly: `"sideEffects": ["./dist/**/*.js", "./dist/**/*.cjs"]` (or disable `splitting` and enumerate the three entries). You gain nothing from the current narrower claim - the library is not meaningfully tree-shakeable anyway - and you close a real class of "works in dev, operators missing after webpack production build" reports. Document the all-in bundle cost in the README comparison table; zero-dependency plus 142 KB is still a fine story if told first.
- **Risk/effort:** One-line config change; no behavior change for correct bundlers.

---

#### F19 - API ergonomics: mandatory predicates and default values deviate from every LINQ dialect
- **Severity:** Medium (design decision to make consciously before freeze)
- **Location:** `types/core.ts` - `first`, `last`, `single`, `firstOrDefault(predicate, defaultValue)`, `any(predicate)`, etc.
- **Problem:** `first()` with no arguments - the single most common LINQ call - is a compile error. `any()` (the "is it non-empty" idiom) likewise. `firstOrDefault` requires an explicit `defaultValue`, which is defensible in a language without implicit `default(T)`, but combined with the mandatory predicate it makes the common cases noisy: `seq.firstOrDefault(() => true, undefined)`. The README itself forgets the rule twice (F8), which is the strongest evidence the rule fights the grain. Meanwhile `isNullOrEmpty()` exists with genuinely surprising semantics: it returns true for a *non-empty* sequence whose first element is null (CHECK20: `[null,1,2]` -> true), which is neither LINQ's `Any()` negation nor a null check on the sequence - it will be misused.
- **Recommendation:** Make predicates optional (`first(predicate?)` etc.) - purely widening, non-breaking, and it fixes the README examples as written. Keep required `defaultValue` (it is the honest TS design). Rename or split `isNullOrEmpty`: `isEmpty()` for cardinality and let users write `.first()`-based null checks; at minimum rewrite its one-line doc to lead with the first-element-null behavior.
- **Risk/effort:** Optional predicates: non-breaking, small. `isNullOrEmpty` rename: breaking, needs deprecation alias.

---

#### F20 - Registry guard policy is inconsistent across the three registration entry points
- **Severity:** Low
- **Location:** `TyneqOperatorRegistry.register` (runs guards unconditionally), `registerSource` (skips guards for `"internal"`), `registerBuiltin` (never runs guards)
- **Problem:** Three different policies for the same concept. `register()` runs guards even for internal registrations, contradicting `registerSource`'s documented rationale ("guards exist to validate external plugin registrations only"). Any guard a user installs via `addGuard` will see internal `createOperator`-style registrations but not builtins and not internal sources - an inconsistent observability surface that is hard to document and easy to trip over when someone writes a guard enforcing naming conventions.
- **Recommendation:** Extract one private `runGuards(entry)` that applies a single policy (suggest: guards run for external only, everywhere) and call it from all three paths. Document the policy once on `addGuard`.
- **Risk/effort:** Small; observable only to guard authors.

---

#### F21 - `Tyneq.enumerate` is the one source factory outside the plan system
- **Severity:** Low
- **Location:** `src/core/tyneq.ts:211-222`
- **Problem:** Every other factory is `@source`-registered and produces a named source node. `enumerate` delegates to `from` with an anonymous wrapper object, so its plan prints as `from({...})` (CHECK15), it cannot be re-sourced meaningfully via `CompileOptions.source`, and it is invisible to `OperatorRegistry.listSources()`. One factory breaking the pattern undermines "pipelines become data" for anyone who uses it.
- **Recommendation:** Register it: `@source({ source: "internal" })` with a proper `new QueryNode("enumerate", [source], null, "source", kind)` and an internal enumerator (or keep the generator wrapper but build the node explicitly).
- **Risk/effort:** Small, additive; plan output changes from `from({...})` to `enumerate(...)` (observable in printed plans only).

---

### D. Design patterns and principles (GoF + SOLID)

Pattern-by-pattern, weaknesses first, as requested:

- **Template Method (`TyneqBaseEnumerator`)** - the best-executed pattern in the codebase: `initialize`/`handleNext`/`disposeSource`/`disposeAdditional` hooks with the base owning the state machine. Its one hole is the exception path (F1), which is precisely the kind of invariant Template Method exists to centralize - fix it there and every one of the 60+ enumerators inherits the fix.
- **Visitor (query plan)** - honest assessment: this is Visitor in name more than in structure. `QueryPlanVisitor<T>` has a single `visit(node)` method and `QueryNode.accept` just calls it back; there is no per-node-type dispatch (there is only one node class), so `accept` adds a level of indirection with no polymorphic payoff. That is fine - a homogeneous linked list does not need double dispatch - but then `QueryPlanWalker`/`QueryPlanTransformer` are really just fold/map over a list. Two real costs: (1) both traversals are recursive, so a 10k-operator generated pipeline overflows the stack (make `visit` iterative - `QueryPlanPrinter.collectNodes` already is); (2) third-party extensibility is genuinely fine for *walking/rewriting* (CHECK17 shows custom operators appear as first-class named nodes, not black boxes - this is a real strength worth advertising), but visitors cannot attach *typed* per-operator knowledge; matching is by `operatorName` string. Consider exporting well-known name constants or a `NodeMatcher` helper so transformer authors do not typo `"orderByDescending"`.
- **Strategy (streaming vs buffering)** - not actually present as a pattern, and correctly so: the "strategy" is just which enumerator class you write, and the `kind` label is pure metadata. The weakness is that the label is *asserted, never verified* (F4): nothing stops `@operator("x", "streaming")` on a fully-buffering enumerator, including tyneq's own `split`. Since verification is impossible statically, invest in the metadata being right (F4 recommendation 2).
- **Decorator (GoF) vs TC39 decorators** - the conceptual sequence-wrapping decorator (each operator wraps an enumerator) and the literal TC39 decorators (registration annotations) coexist without confusion in the code; the docs, however, use "decorator" for both within the same page. One glossary sentence in the plugin guide ("TC39 decorators register; enumerator classes wrap") would close it. No code change needed.
- **Factory Method** - `createEnumerable`/`createOrderedEnumerable`/`createCachedEnumerable` as protected abstract factories is clean OCP; but the `SequenceFactory` double-cast (documented, centralized) exists solely because registration closures live outside the hierarchy. A cleaner shape: make the three factories `protected` *and* expose one internal static `TyneqEnumerableBase.__create(sequence, factory, node)` friend-function in the same module, so the cast disappears and the capability is scoped to the module rather than to anyone who copies the cast. Low priority; current form is honest and documented.
- **Chain of Responsibility** - the pull pipeline is CoR in effect; no issues beyond F1.
- **Registry (global mutable state)** - the known trade-offs apply and are mostly handled: duplicate (name, targetClass) registration throws with a high-quality error (CHECK18), unregister exists for tests, guards/hooks give observability. Remaining concerns: import-order dependency is real (an operator module that is never imported never registers - LESSONS documents this footgun but the runtime cannot detect it); there is no namespacing convention for third-party operators, so two independent npm plugins registering `flatten`-like names collide at *import time* of the second package with an error the app author (not the plugin author) must resolve. Recommend documenting a `vendorName` prefix convention now, before an ecosystem exists.
- **SRP** - `TyneqEnumerableBase` (743 lines, ~75 methods) is the god-class-by-design that every fluent LINQ implementation accepts; the per-operator logic correctly lives in the enumerator classes, so the base is wide but shallow. The real SRP violation is `types/core.ts` (F9): one file is simultaneously the public contract, the plugin contract, and the internal plumbing, and it imports concrete classes (`TyneqEnumerableBase`, `OperatorMetadata`) - a types module that depends on implementations inverts the intended layering and is why internals leak through `export *`.
- **OCP** - genuinely satisfied: new operators (internal and external) extend the system without touching the compiler, printer, or walker (verified by CHECK17). The one modification hotspot is `TyneqEnumerableBase.ts` itself for builtins (import + method + interface + registration), which the LESSONS checklist manages procedurally. Acceptable.
- **LSP** - `TyneqOrderedSequence` and `TyneqCachedSequence` substitute cleanly for `TyneqSequence` (all operators available, verified by the memoize-then-orderBy tests). Two soft spots: `TyneqCachedEnumerable.refresh` mutates shared state observable through outstanding iterators (F13), and `asc()`/`desc()` are interface methods that - unlike their siblings `thenBy`/`thenByDescending` - are not `@builtin`-registered, so registry introspection and plan-driven tooling see an incomplete ordered surface. Register them.
- **ISP** - plugin authors are *not* forced into lifecycle hooks (all have default implementations); good. The violation runs the other way: root-package consumers receive the entire plugin/reflection surface (F9).
- **DIP** - the compiler depends on the registry abstraction and discovers the most-specific implementation by prototype-chain walk (`findOperatorEntry`) rather than hardcoding operator lists - this is the architecture's strongest DIP credential. The `options.source` positional assumption (F6) is the one place it depends on convention instead of metadata.

---

### E. Decorator API and class-based extension API

---

#### F5 - `hasMethod` checks own properties only: inherited `handleNext`/`process` is rejected
- **Severity:** High (for plugin authors; it forbids a normal OO idiom with a misleading error)
- **Location:** `src/plugin/decorators/operator.ts:49`, `terminal.ts:42`, `orderedOperator.ts:49`, `cachedOperator.ts:47`; root cause `src/utility/reflect.ts:148-163` (`findDescriptor` defaults `inherited: false`)
- **Problem:** A plugin author who builds an intermediate base (`abstract class BasePairwiseish<T> extends TyneqEnumerator<T> { protected handleNext() {...} }`) and decorates a concrete subclass gets `PluginError: class "X" must define a protected handleNext()...` even though the class is perfectly valid. The error text ("Ensure the class extends TyneqEnumerator") actively points away from the real cause.
- **Evidence:** CHECK16 - exactly this shape was rejected with the quoted `PluginError`.
- **Recommendation:** `reflect(target.prototype, { inherited: true }).hasMethod("handleNext")` in all four decorators. The walk stops at `Object.prototype` already; you may want to additionally stop at `TyneqBaseEnumerator.prototype` so a class that *fails* to implement abstract `handleNext` (possible in JS, impossible in TS) is still caught. Add the inheritance case to `operatorDecorators.spec.ts`.
- **Risk/effort:** One-line fix per decorator; strictly widens accepted inputs.

---

#### F22 - Decorator type safety is by convention: `TArgs`, `validate`, and the constructor are uncorrelated
- **Severity:** Medium
- **Location:** `operator.ts:40-66` and siblings
- **Problem:** Three type surfaces must agree for a class-based operator to be sound, and nothing ties them together: (1) the `TArgs` you pass to `@operator<TArgs>`, (2) the enumerator constructor `(source, ...actualArgs)`, (3) the module-augmentation signature the author writes by hand. `new target(base.getEnumerator(), ...userArgs)` is `any`-typed (documented as a necessary decorator idiom - agreed), so a `TArgs` of `[size: number]` on a constructor taking `(source, sizes: number[])` compiles, registers, and fails only at iteration time. The functional API is materially better here: `createOperator`'s `factory: (source, ...args: TArgs) => ...` forces (1)=(2) by construction, and `NoInfer<TArgs>` on validate is a nice touch.
- **Recommendation:** Constrain the decorated class against `TArgs`:
  ```ts
  export function operator<TArgs extends unknown[] = never>(
      name: string,
      category: "streaming" | "buffer",
      validate?: (...args: TArgs) => void
  ) {
      return function <TClass extends new (source: Enumerator<any>, ...args: TArgs) => TyneqBaseEnumerator<any, any>>(
          target: TClass, _context: ClassDecoratorContext
      ): TClass { ... };
  }
  ```
  TS decorator variance makes this fiddly (hence the existing `any[]` note in LESSONS) but the *first* parameter and the `...args: TArgs` tail are checkable even if the instance type stays loose - that closes surface (1)=(2). Surface (3) is uncloseable without codegen; consider shipping a documented `OperatorMethod<TArgs, TResult>` helper type so augmentations at least share one alias.
- **Risk/effort:** Type-level only; may surface latent mismatches in downstream code (that is the point).

---

#### F23 - Dual API verdict: parity is real, so make the functional API the headline and keep decorators
- **Severity:** Medium (strategic recommendation, not a defect)
- **Location:** plugin API as a whole
- **Assessment against the stated question (deprecate one?):**
  - *Runtime parity:* verified - both route through `OperatorRegistry.register`, both produce first-class plan nodes, both recompile (CHECK17), both dispose correctly on early termination (CHECK19 for generators; class path via `TyneqEnumerator.disposeSource`).
  - *Capability:* the class path's genuine advantages are (a) `TyneqOrderedEnumerator`/`TyneqCachedEnumerator` access to the full sequence object, and (b) fine-grained lifecycle (`doneWithYield`, `earlyComplete`) that a generator expresses less explicitly. But `createOrderedOperator`/`createCachedOperator` exist too, so (a) is not exclusive. The functional path's advantages: better type inference (F22), no Stage-3-vs-experimentalDecorators constraint (which the README itself must spend 60 lines explaining), less ceremony.
  - *Side-by-side for the identical operator (`everyOther`):* the generator version is 8 lines; the decorator version is ~20 lines plus a class plus the mutual-exclusivity caveat for NestJS/Angular users.
  - *Maintenance burden:* 7 decorators + 7 factory functions + 7 base classes = 21 public surfaces expressing 2 concepts. Each new sequence subtype (a hypothetical `TyneqAsyncSequence`) multiplies this.
- **Recommendation:** Do not deprecate - the class path is the right tool for stateful multi-phase enumerators and it is already built. But: (1) document the functional API as the primary path and the class API as the advanced path (the README already leans this way; make it explicit); (2) fix F5 and F22 so the class path is not the *worse-typed* one; (3) resist adding a third style, and when new sequence subtypes appear, consider generating the ordered/cached decorator+factory pairs from one implementation rather than hand-copying (the four decorator files are already near-identical - textbook copy-paste drift risk, see `orderedOperator.ts` vs `cachedOperator.ts` which differ by ~6 tokens).
- **Risk/effort:** Docs plus refactoring appetite.

---

#### F24 - Module augmentation ergonomics: the runtime guard exists; the failure modes to document are TS-side
- **Severity:** Low
- **Location:** README plugin section, `declare module "tyneq"` pattern
- **Assessment:** Two plugins registering the same method name: the runtime collides correctly and loudly (`RegistryError`, CHECK18) at import time of the second plugin - good. The TS side is where users will suffer: two packages augmenting `TyneqSequence<T>` with the same name produce either a silent merge (identical signatures) or a confusing "subsequent declarations must have the same type" error pointing into `node_modules`; and an augmentation with no corresponding runtime registration type-checks and then throws `TypeError: seq.foo is not a function` with no tyneq fingerprint. Also, augmentation targets the *interface*, so a method registered only for ordered sequences must be augmented on `TyneqOrderedSequence` - nothing enforces that the augmentation site matches the `targetClass` the registration used.
- **Recommendation:** Add a "failure modes" subsection to the plugin guide covering: name collisions (runtime error at import, TS merge error), augmentation-without-registration (symptom + reminder that importing the plugin module is what triggers registration), and matching augmentation interface to registration target. Cheap, and it will save your issue tracker.
- **Risk/effort:** Docs only.

---

### F. Reflection API and reflection clarity

---

#### F25 - The reflection surface is larger than the library's needs and is exported from the root
- **Severity:** Low
- **Location:** `src/utility/reflect.ts` (289 lines), exported from `src/index.ts` and `tyneq/utility`
- **Assessment:** Internal reflection use is genuinely minimal and well-encapsulated: symbol-keyed `tyneqQueryNode` (a `unique symbol`, non-colliding, exported deliberately - correct), `builtinMeta` symbol stamping for the `@builtin`/`@sequence` two-phase pattern (clever and contained), `Symbol.iterator` interop, and `Object.getPrototypeOf` walks in the compiler and registry. No `Reflect.metadata`, no decorator-metadata proposal dependence - so the "will engine/TS changes break it" risk is essentially nil; esbuild's `__decorateElement` output is self-contained (confirmed in `dist`).
  Two observations: (1) `ReflectionContext` (members/fields/accessors/invoke) is a general-purpose reflection library of which tyneq uses exactly `hasMethod`/`tryGetMethod`; shipping and semver-guaranteeing the rest from the *root* export is surface without demand - `tyneq/utility` alone would suffice. (2) Debugger introspection of a sequence is decent: `TyneqEnumerable` shows `enumeratorFactory` and the symbol-keyed node, and `QueryPlanPrinter.print(seq[tyneqQueryNode])` is the good story - but nothing points a debugging user to it. A `toString()`/`[Symbol.for("nodejs.util.inspect.custom")]` on `TyneqEnumerable` that renders the plan (`"TyneqSequence<from -> where -> select>"`) would make console-logging a sequence self-explanatory instead of `TyneqEnumerable { enumeratorFactory: { getEnumerator: [Function] } }`.
- **Recommendation:** Move `reflect`/`ReflectionContext` exports to `tyneq/utility` only (pre-freeze); add the inspect hook (Node-gated, tiny, big DX win).
- **Risk/effort:** Export move is breaking for root importers; inspect hook is additive.

---

### G. Type system quality

---

#### F26 - Type health is good overall; the remaining holes are known and two are fixable
- **Severity:** Low (inventory finding)
- **Location:** various
- **Assessment:**
  - Chained inference: interface methods with explicit generics mean a 7-operator chain preserves exact element types, including `ofType` narrowing via a user guard and `flatten`'s `this: TyneqSequence<Iterable<TInner>>` constraint (the interface-side constraint is correct; the class-side `as unknown as` cast is implementation-only and safe because the interface gates callers).
  - `any` inventory in `dist` types: confined to `Constructor`/`Factory`/`BoundMethod` utility types, decorator constraints (documented as required idioms in LESSONS - verified accurate), and `SequenceConstructor`. No `any` leaks into operator signatures. Good.
  - Fixable hole 1: `pipe`'s factory result type `Enumerator<TResult> | IterableIterator<TResult>` accepts an `IterableIterator` and then wraps it in a sequence claiming re-iterability - a one-shot `pipe` factory that returns a captured iterator has the F3 problem with type-system blessing. Since the factory is invoked per-`getEnumerator`, the type is actually fine; note it in `pipe`'s docs ("factory is called once per iteration; return a fresh iterator each time").
  - Fixable hole 2: `OrderedEnumerable.source`/`parent` are mutable properties on the interface (`types/core.ts:1061-1064`) while the implementation declares them `readonly`. Make the interface `readonly` to match.
  - `tsconfig`: `strict` and `noImplicitOverride` on - good; missing `noUncheckedIndexedAccess` (the sorter and ring buffers index freely; enabling it would document the invariants with `!` at ~a dozen sites) and `exactOptionalPropertyTypes`. Worth enabling before freeze while churn is cheap.
- **Risk/effort:** Small individually.

---

### H. Testing and tooling

---

#### F10 - ESLint enforces style only; no correctness rules at all
- **Severity:** Medium
- **Location:** `eslint.config.ts`
- **Problem:** The config hand-picks quotes/semi/eqeqeq/naming and nothing else: no `tseslint.configs.recommended` (or `recommendedTypeChecked`), so `no-explicit-any`, `no-unsafe-*`, `no-floating-promises`, `no-unused-vars`, `no-misused-promises`, `restrict-template-expressions` are all off. A linter that would flag none of F1/F2/F3 is expected; a linter that would not flag an accidental `any` or an unawaited promise in `toAsync` consumers' example code is a gap the repo's own style-rule discipline deserves better than.
- **Recommendation:** Layer `...tseslint.configs.recommendedTypeChecked` under the existing style rules (with `parserOptions.projectService: true`), then selectively disable what conflicts with the documented `any[]` decorator idioms via targeted `eslint-disable` comments that cite LESSONS. Expect a one-time cleanup cost; schedule it before freeze.
- **Risk/effort:** Tooling only; medium one-time noise.

---

#### F27 - Test suite: excellent breadth on happy paths, near-zero depth on the failure model
- **Severity:** Medium (this is the gap map requested; coverage % is not the issue - 96.5% line coverage coexists with every empirical failure in this report)
- **Location:** `tests/`
- **What the suite covers well (read as spec):** per-operator input/output including empties and single elements, validation error types per operator, plan structure (printer/walker/transformer/optimizer shapes), compiler round-trips for builtin pipelines, registry duplicate/unregister behavior, decorator happy paths, basic re-iterability (three tests in `pipeline.spec.ts`).
- **Confirmed gaps, mapped to risk (each of these is a missing test that would have caught a finding in this report):**
  1. *Error-path lifecycle:* no test anywhere asserts that a throwing callback disposes the upstream or poisons the enumerator (F1). Add a `ResourceTrackingSource` test helper and run it against a matrix of operators.
  2. *memoize failure model:* 3 tests total for the most stateful component in the library; none cover source errors (F2), refresh-mid-iteration (F13), or concurrent iterators (CHECK25 passed, but by luck of design, not by contract - pin it).
  3. *One-shot sources:* no test feeds a generator object to `from` or to `zip`/`concat`/`except` and re-iterates (F3).
  4. *Optimizer equivalence:* the optimizer specs assert plan *shape* and fused-function truth tables, never that optimized-compiled output and traces equal the original pipeline's (F7 recommendation). A property-style test with instrumented callbacks over randomized small pipelines is ~50 lines and permanently guards every future fusion rule.
  5. *Live-vs-compiled equivalence:* compiler specs check compiled output against expected arrays, not against the live sequence's output for the same plan - the stronger invariant, and the one "pipelines become data" rests on (CHECK11/22 pattern).
  6. *Decorator edge cases:* no inherited-`handleNext` case (F5), no malformed-usage matrix (missing category, wrong base class, validate/constructor arity mismatch).
  7. *`CompileOptions.source` against non-`from` plans* (F6).
  8. *dist smoke test:* nothing imports the built `dist` (both module formats) and runs a pipeline plus a decorator registration - the esbuild-transform-divergence risk the README's decorator section discusses is untested. One `dist.spec` executed post-build in CI closes it.
- **Recommendation:** Prioritize 1-3 (they guard the fixes for the High findings), then 4-5 (they guard the query plan value proposition). 
- **Risk/effort:** Test-only; the helpers (resource-tracking source, call-trace instrumentation) are reusable across all eight.

---

## 3. Architectural recommendations

1. **Adopt an explicit error-lifecycle contract, centrally enforced** (F1, F2). One paragraph in the docs - "an enumerator that throws is completed: resources released, subsequent `next()` returns done; memoize records and rethrows upstream errors until refresh" - and two localized code changes (`TyneqBaseEnumerator.next`, `TyneqCachedEnumerable.tryGetAtFromCache`). This is the highest-value change in this report: it converts the library's failure behavior from undefined to specified, and every operator inherits it for free because the Template Method already centralizes the lifecycle. Migration: none for correct code; behavioral change only where users resumed thrown-through iterators.

2. **Make operator memory class first-class registry metadata and generate the docs from it** (F4, F8). The `OperatorMetadata.extensions` field already exists and is unused. Stamp `memory: "O(1)" | "O(k)" | "O(n)"` (plus `k`'s parameter name) at registration, generate the README operator tables and the per-operator remark lines from `OperatorRegistry.list()` in a docs script, and the taxonomy can never drift again - it becomes impossible to add an operator without classifying it. This also gives plugin authors the same vocabulary.

3. **Shrink the public surface to the stated contract before the freeze** (F9, F25). Explicit export lists in `src/index.ts`, internals out of the root `.d.ts`, reflection confined to `tyneq/utility`, plugin API confined to `tyneq/plugin` (or the root duplication declared intentional in docs). Every symbol in a 1.0 `.d.ts` is a decade of semver obligation; this is the last cheap moment to prune. Migration: a `1.0.0-rc` with the pruned surface and a changelog list of moved symbols.

4. **Define the one-shot-iterable policy** (F3). Whatever is chosen (throw on second enumeration recommended), it needs to be one policy, applied at `EnumerableAdapter` for sources and at a shared `IterableArg` wrapper for operator arguments, documented in the re-iterability section. A per-operator fix would recreate the drift problem.

5. **Consolidate the 7+7+7 plugin surface behind two documented paths** (F23). No deprecation - but stop the copy-paste growth: the four operator decorators and seven factories share ~90% of their bodies via `RegistrationUtility` already; finish the job so a future `TyneqAsyncSequence` costs one table entry, not four new files.

---

## 4. Follow-up investigations (proposed mid-analysis, then executed)

Per the brief, these were identified during the first pass and then actually chased:

1. *"The `@builtin` buffer labels look pasted - is `distinct` actually buffering?"* -> ran it against an infinite source (CHECK3): it streams. Escalated into F4 and the grep sweep that found 17+26 identical remark strings (F8).
2. *"`TyneqBaseEnumerator.next` has no try/catch - what actually happens on a throwing selector?"* -> built a resource-tracking source (CHECK1) and a resume probe (CHECK2): leak confirmed, resumable-corrupted-state confirmed. F1.
3. *"`tryGetAtFromCache` keeps `sourceEnumerator` on throw - does memoize corrupt?"* -> CHECK7: silent truncation confirmed. F2. Also probed refresh-mid-iteration (CHECK8) and concurrent iterators (CHECK25 - passed).
4. *"`reflect()` defaults to own-properties-only - does the decorator reject inherited `handleNext`?"* -> CHECK16: confirmed rejection with misleading error. F5.
5. *"Does where-fusion really change side effects as the docs claim?"* -> instrumented trace comparison (CHECK6): traces identical; docs wrong in the safe direction. F7, with proof sketch.
6. *"Does orderBy-on-orderBy diverge between live execution (which resets to `this.source`) and the recompiled plan (which replays both sorts)?"* -> CHECK22: outputs identical (`yzwx`) - both paths reset to the original source because the compiled `orderBy` dispatches through the same `createOrderedEnumerable` override. No finding; worth pinning with test F27.5. Multi-key `thenBy` also verified equivalent (CHECK11).
7. *"Is `sideEffects` consistent with split chunks carrying registrations?"* -> esbuild bundle experiment: registrations survive today (12 registration sites retained, bundle executes), but the declaration is wrong in principle and the all-in cost is ~142 KB for a one-operator pipeline. F18.
8. *"Do custom operators appear as black-box plan nodes?"* -> CHECK17: they appear as named nodes and recompile. Positive result, recorded in the exec summary.
9. *"LESSONS mentions `inferOperatorKind` - does it still exist?"* -> grep: absent from `src`. F15.

Not chased (requires tooling beyond this session): GC-level verification that unregistered operator classes and plan-retained sources are collectable (heap snapshots); a webpack-production-mode build to definitively prove/disprove the F18 chunk-pruning scenario (the esbuild result is suggestive but webpack's `sideEffects` handling is the riskier one); benchmark suite for iterator overhead vs hand-rolled loops (no benchmarks exist in the repo - worth adding `vitest bench` before making performance claims in the README comparison table).

---

## 5. Open questions for the author

1. **`except`/`intersect`/`union` dedupe the source** (CHECK12: `[1,1,2,2,3].except([3])` -> `[1,2]`), matching .NET set semantics. Intentional and worth stating in the operator docs, or accidental via the seen-set implementation? The one-line doc ("Returns elements not present in `excludedValues`") does not mention deduplication either way.
2. **`isNullOrEmpty`'s first-element-null semantics** (F19): is "sequence whose head is null" a use case from a real consumer, or did the name drift from a string-inspired helper? The answer decides rename vs document.
3. **Required predicates on `first`/`last`/`single`/`any`** (F19): deliberate API philosophy ("force the caller to say what they mean") or historical accident? The README examples suggest even the author reaches for `first()`.
4. **Is `pipe`'s plan node meant to be compilable?** It records the factory function as an arg, so compiled plans replay it by reference - which works in-process but makes any future plan-serialization story a lie for `pipe` nodes. If serialization is ever a goal, `pipe` nodes need a declared "opaque, non-serializable" marker now.
5. **`refresh()` return type** says "returns a new TyneqCachedSequence" while returning `this`. Which is the intended contract? Returning `this` is friendlier (chaining without rebinding); if so, fix the doc and freeze it.
6. **Root re-export of the plugin API** (F9): is `import { createGeneratorOperator } from "tyneq"` (as the README shows) the blessed form, making `tyneq/plugin` merely organizational? Either answer is fine; the docs and the export map should agree on one.
7. **`backsert`** is an unusual name for insert-from-the-end (itertools' `more-itertools` heritage?). Pre-1.0 is the only time renaming (e.g. `insertFromEnd`) is cheap - keep or rename?
8. **Ordered/cached operator decorators receive the full sequence** "because ordered/cached sequences own their own lifecycle". Is a third-party `@orderedOperator` expected to be able to *re-sort* (access `getSorter`)? `OrderedEnumerable` exposes `getSorter`/`parent`/`source` publicly-but-@internal - plugin authors will use whatever the type lets them touch; decide whether that trio is plugin API or not, and mark accordingly.

---

*End of audit. Empirical repro scripts used for CHECK1-25 are reproducible from the descriptions inline; each ran against `src` via tsx on 2026-07-13, all on branch `dev` at commit 648f0a0.*
