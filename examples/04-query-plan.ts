/**
 * Query plan inspection example.
 *
 * Shows how to read, walk, and optimize the query plan attached to any pipeline.
 * Run with: npx tsx examples/04-query-plan.ts
 */
import {
    Tyneq,
    QueryPlanPrinter,
    QueryPlanOptimizer,
    QueryPlanCompiler,
    tyneqQueryNode,
} from "../src/index";

// ---- Build a pipeline and inspect its plan -----------------------------------
const pipeline = Tyneq.range(1, 100)
    .where((n) => n % 2 === 0)
    .where((n) => n < 20)
    .select((n) => n * 10)
    .select((n) => n + 1)
    .take(3);

const node = pipeline[tyneqQueryNode];

console.log("Raw plan:");
console.log(QueryPlanPrinter.print(node));
// range -> where -> where -> select -> select -> take

// ---- Optimize (fuse consecutive where/select chains) -------------------------
const optimized = QueryPlanOptimizer.optimize(node);
console.log("\nOptimized plan:");
console.log(QueryPlanPrinter.print(optimized));
// range -> where (fused) -> select (fused) -> take

// ---- Compile and execute the optimized plan ----------------------------------
const result = QueryPlanCompiler.compile(optimized, Tyneq.range(1, 100)).toArray();
console.log("\nResult:", result);
// [21, 41, 61]

// ---- Walk the plan to collect operator names ---------------------------------
const names: string[] = [];
(function walk(n: typeof node) {
    if (!n) return;
    names.push(n.name);
    if ("source" in n && n.source) walk(n.source as typeof node);
})(optimized);
console.log("\nOperator chain (terminal first):", names.reverse().join(" -> "));
