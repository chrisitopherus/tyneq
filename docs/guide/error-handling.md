# Error Handling

Tyneq raises domain-specific errors for invalid inputs and invalid sequence states. This page explains when those conditions occur and how to handle them.

## Error Categories

### Argument Errors

Raised when arguments are missing, invalid, or out of supported range.

Typical cases:

- Null or undefined function arguments
- Invalid numeric boundaries for range-like operations
- Unsupported comparer or selector inputs

### Sequence State Errors

Raised when an operation expects elements that are not present.

Typical cases:

- `first()` on an empty sequence
- `single()` on empty or multi-element sequences
- Operations that require at least one element

### Not Supported or Invalid Operation Errors

Raised when an operation cannot be completed under current semantics.

## Safe Usage Patterns

### Prefer Default Variants Where Appropriate

Use `firstOrDefault`, `lastOrDefault`, or `singleOrDefault` when absence is a valid outcome.

```ts
import { Tyneq } from "tyneq";

const value = Tyneq.from([] as number[]).firstOrDefault(-1);
// value === -1
```

### Guard Before Strict Terminal Calls

```ts
import { Tyneq } from "tyneq";

const query = Tyneq.from(items);

if (query.any()) {
  const first = query.first();
  // safe for non-empty sequence
}
```

### Catch Specific Error Types

```ts
import { Tyneq, SequenceContainsNoElementsError } from "tyneq";

try {
  const first = Tyneq.from([] as number[]).first();
  console.log(first);
} catch (error) {
  if (error instanceof SequenceContainsNoElementsError) {
    console.log("No elements available.");
  } else {
    throw error;
  }
}
```

## Practical Guidance

1. Use strict terminal operators (`first`, `single`, `elementAt`) when failure is exceptional.
2. Use default-based variants when missing values are expected in normal control flow.
3. Keep validation close to query construction for clearer failure points.

## Related Pages

- [Core Concepts](/guide/concepts)
- [Examples](/guide/examples)
- [API Reference](/api/reference/)
