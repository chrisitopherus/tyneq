# Queries and Deferred Execution

## What deferred execution means

A query pipeline is defined immediately but executed later. This allows you to:

- compose operations cheaply
- avoid unnecessary work
- terminate early when possible

## Example

```ts
import { Tyneq } from "tyneq";

const query = Tyneq
  .range(1, 10)
  .where(n => n % 2 === 0)
  .select(n => n * n)
  .take(3);

// Nothing has executed yet.

const result = query.toArray();
console.log(result);
// [4, 16, 36]
```

## Streaming vs buffering in practice

- Streaming operators can emit results as input arrives.
- Buffering operators need more data before yielding output.

For example, `where` + `select` can stream, while `orderBy` requires buffering.

## Practical guidance

- Prefer streaming operators early when possible.
- Add buffering operators only where semantics require them.
- Place terminal operators close to boundaries (I/O, controller return, UI view model).

## Side effects and re-enumeration

Because queries are lazy and re-iterable, side effects in operators like `tap` run every time you enumerate. If you need one computed snapshot reused many times, use memoization.
