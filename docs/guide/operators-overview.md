# Operators Overview

All operators fall into one of three categories. See [Concepts](/guide/concepts) for what each category means.

## Factories

Create a new sequence from a source.

| Operator | Description |
|---|---|
| `Tyneq.from(source)` | Wrap any `Iterable<T>` |
| `Tyneq.range(start, count)` | Integer sequence from `start` of length `count` |
| `Tyneq.empty<T>()` | Empty sequence |
| `Tyneq.enumerate(source)` | Pair each element with its index as `[number, T]` |
| `Tyneq.random(count, randomizer)` | Sequence of `count` values from a callback |

## Streaming

Process one element at a time. O(1) memory. Do not require the source to end.

| Operator | Description |
|---|---|
| `select(fn)` | Project each element |
| `selectMany(fn)` | Project each element to a sequence and flatten |
| `where(pred)` | Filter elements matching a predicate |
| `take(n)` | Keep the first `n` elements |
| `takeWhile(pred)` | Keep elements while predicate holds |
| `skip(n)` | Skip the first `n` elements |
| `skipWhile(pred)` | Skip while predicate holds, yield the rest |
| `skipLast(n)` | Skip the last `n` elements |
| `append(item)` | Yield all source elements then `item` |
| `prepend(item)` | Yield `item` then all source elements |
| `concat(other)` | Concatenate with another sequence |
| `zip(other, selector)` | Pair elements from two sequences; stops at the shorter one |
| `scan(seed, fn)` | Emit the running accumulator after each element |
| `pairwise()` | Emit overlapping `[prev, curr]` pairs |
| `chunk(size)` | Split into fixed-size arrays; last chunk may be smaller |
| `split(pred)` | Split on elements matching the predicate; they are excluded |
| `defaultIfEmpty(value)` | Yield source, or a single `value` if source is empty |
| `populate(value)` | Replace every element with `value`; preserves element count |
| `cast<U>()` | Compile-time type assertion (no runtime check) |
| `ofType<U>(guard)` | Filter and narrow by type guard |
| `tap(fn)` | Run a side-effect per element; pass through unchanged |
| `tapIf(fn, pred)` | Run `fn` per element only when `pred()` returns `true` at call time |
| `throttle(n)` | Emit every `n`-th element |
| `pipe(factory)` | Apply a custom transformation factory |

## Buffering

Materialize the full source before producing output. O(n) memory.

| Operator | Description |
|---|---|
| `orderBy(key, cmp?)` | Sort ascending |
| `orderByDescending(key, cmp?)` | Sort descending |
| `thenBy(key, cmp?)` | Secondary ascending sort (chains on ordered sequence) |
| `thenByDescending(key, cmp?)` | Secondary descending sort |
| `groupBy(key, value, result)` | Group by key, project values, map each group to a result |
| `distinct()` | Remove duplicates by reference equality |
| `distinctBy(key)` | Remove duplicates by projected key |
| `reverse()` | Reverse the sequence |
| `shuffle()` | Random permutation |
| `union(other)` | Union with deduplication |
| `unionBy(other, key)` | Union deduplicated by projected key |
| `intersect(other)` | Elements present in both sequences |
| `intersectBy(other, key)` | Intersection by projected key |
| `except(other)` | Elements not present in `other` |
| `exceptBy(other, key)` | Difference by projected key |
| `join(inner, outerKey, innerKey, result)` | Inner join on key equality |
| `groupJoin(inner, outerKey, innerKey, result)` | Left outer join with grouped inner results |
| `backsert(index, other)` | Insert `other` at a position counted from the end |
| `memoize()` | Cache results across re-enumerations |

## Terminal

Execute the pipeline and return a value.

| Operator | Description |
|---|---|
| `toArray()` | Collect into `Array<T>` |
| `toSet()` | Collect into `Set<T>` |
| `toMap(selector)` | Collect into `Map<K, V>` via a `{ key, value }` selector |
| `toRecord(selector)` | Collect into `Record<K, V>` via a `{ key, value }` selector |
| `toAsync()` | Bridge to `AsyncIterable<T>`; each loop starts a fresh traversal |
| `first(pred)` | First element matching predicate (throws if none) |
| `firstOrDefault(pred, default)` | First match, or `default` |
| `last(pred)` | Last element matching predicate (throws if none) |
| `lastOrDefault(pred, default)` | Last match, or `default` |
| `single(pred)` | Exactly one match (throws if zero or more than one) |
| `singleOrDefault(pred, default)` | One match or `default` (throws if more than one) |
| `elementAt(index)` | Element at zero-based index (throws if out of range) |
| `elementAtOrDefault(index, default)` | Element at index, or `default` |
| `count()` | Number of elements |
| `countBy(pred)` | Number of elements matching predicate |
| `sum(selector)` | Sum of projected values |
| `average(selector)` | Mean of projected values |
| `min(cmp?)` | Minimum element |
| `max(cmp?)` | Maximum element |
| `minBy(key, cmp?)` | Element with the minimum projected key |
| `maxBy(key, cmp?)` | Element with the maximum projected key |
| `minMax(cmp?)` | Both min and max in a single pass; returns `{ min, max }` |
| `aggregate(seed, fn, result)` | General fold |
| `any(pred)` | `true` if any element matches |
| `all(pred)` | `true` if all elements match |
| `contains(value)` | `true` if value is present by reference equality |
| `indexOf(pred, start?)` | Index of first match, or `-1` |
| `sequenceEqual(other, cmp?)` | `true` if sequences are element-wise equal |
| `startsWith(other)` | `true` if sequence begins with all elements of `other` |
| `isNullOrEmpty()` | `true` if the sequence is empty |
| `consume()` | Drain for side effects; returns `void` |
