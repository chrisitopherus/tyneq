/**
 * Streaming pipeline example.
 *
 * Demonstrates lazy evaluation, re-iteration, and common streaming operators.
 * Run with: npx tsx examples/01-streaming-pipeline.ts
 */
import { Tyneq } from "../src/index";

// ---- Basic pipeline -----------------------------------------------------------
const evens = Tyneq.range(1, 10)
    .where((n) => n % 2 === 0)
    .select((n) => n * n)
    .take(3)
    .toArray();

console.log("Squared evens (first 3):", evens);
// [4, 16, 36]

// ---- Re-iteration: every terminal call re-runs the pipeline ------------------
const query = Tyneq.from([1, 2, 3, 4, 5]).where((n) => n % 2 === 0);
console.log("First run: ", query.toArray());   // [2, 4]
console.log("Second run:", query.toArray());   // [2, 4]  -- fresh traversal

// ---- Factories ----------------------------------------------------------------
const pairs = Tyneq.enumerate(["a", "b", "c"]).toArray();
console.log("Enumerate:", pairs);
// [[0, "a"], [1, "b"], [2, "c"]]

const repeated = Tyneq.repeat("x", 4).toArray();
console.log("Repeat:", repeated);
// ["x", "x", "x", "x"]

const generated = Tyneq.generate(1, (x) => x * 2, 5).toArray();
console.log("Generate (doubles):", generated);
// [2, 4, 8, 16, 32]

// ---- Window / slice / pairwise -----------------------------------------------
const windows = Tyneq.range(1, 5).window(3).toArray();
console.log("Window(3):", windows);
// [[1,2,3],[2,3,4],[3,4,5]]

const sliced = Tyneq.range(0, 9).slice(2, 6).toArray();
console.log("Slice(2,6):", sliced);
// [2, 3, 4, 5]

const adjacent = Tyneq.range(1, 4).pairwise().toArray();
console.log("Pairwise:", adjacent);
// [[1,2],[2,3],[3,4]]

// ---- scan (running aggregate) ------------------------------------------------
const runningSum = Tyneq.range(1, 5).scan(0, (acc, n) => acc + n).toArray();
console.log("Running sum:", runningSum);
// [1, 3, 6, 10, 15]
