# Error Handling

Tyneq raises domain-specific errors for invalid inputs and invalid sequence states. This page explains when those conditions occur, which error class is thrown, and how to handle them.

## Error Classes

All errors extend `TyneqError`, which extends the native `Error`. Import error classes from `'tyneq'` to use in `catch` blocks.

### Argument Errors

Raised when arguments are missing, invalid, or outside the supported range.

| Class | Thrown when |
|---|---|
| `ArgumentNullError` | A required function argument is `null` |
| `ArgumentError` | A required function argument is `undefined` |
| `ArgumentOutOfRangeError` | A numeric argument is outside the accepted range (e.g., negative index) |
| `ArgumentTypeError` | An argument has an unexpected type |

### Sequence State Errors

Raised when an operation expects elements that are not present.

| Class | Thrown when |
|---|---|
| `SequenceContainsNoElementsError` | `first`, `last`, `single`, `min`, `max`, `minMax` are called on an empty sequence |
| `InvalidOperationError` | `single` finds more than one matching element; `elementAt` is out of range |

### Other Errors

| Class | Thrown when |
|---|---|
| `KeyNotFoundError` | A map or record lookup fails for a missing key |
| `NotSupportedError` | An operation is attempted that is not valid under the current state |

## Safe Usage Patterns

### Prefer Default Variants Where Appropriate

Use `firstOrDefault`, `lastOrDefault`, `singleOrDefault`, `elementAtOrDefault`, or `minMax` when absence is a valid outcome.

```ts
import { Tyneq } from "tyneq";

const value = Tyneq.from([] as number[]).firstOrDefault(x => x > 0, -1);
// value === -1  (no exception)
```

### Guard Before Strict Terminal Calls

```ts
import { Tyneq } from "tyneq";

const query = Tyneq.from(items);

if (query.any(x => x.active)) {
  const first = query.first(x => x.active);
  // safe — at least one match exists
}
```

### Catch Specific Error Types

```ts
import { Tyneq, SequenceContainsNoElementsError, ArgumentNullError } from "tyneq";

try {
  const result = Tyneq.from([] as number[]).first(x => x > 0);
} catch (error) {
  if (error instanceof SequenceContainsNoElementsError) {
    console.log("No matching elements.");
  } else {
    throw error;
  }
}
```

## Practical Guidance

1. Use strict terminal operators (`first`, `single`, `elementAt`, `min`, `max`) when absence is a bug — let the error surface.
2. Use default-based variants (`firstOrDefault`, etc.) when missing values are expected in normal control flow.
3. Validate arguments before calling operators that require non-null functions (`where`, `select`, `orderBy`, etc.).
4. Keep terminal calls close to the point where absence would be an error so stack traces are informative.

## Related Pages

- [Core Concepts](/guide/concepts)
- [Operators Overview](/guide/operators-overview)
- [Examples](/guide/examples)
- [API Reference](/api/reference/)
