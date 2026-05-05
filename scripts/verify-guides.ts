/**
 * Verifies code examples from docs/guide/ actually produce the claimed outputs.
 * Run with: npx tsx scripts/verify-guides.ts
 */
import { Tyneq } from "../src/index";

type Case = { label: string; got: unknown; expected: unknown };
const results: Case[] = [];
const fatal: string[] = [];

function check(label: string, got: unknown, expected: unknown): void {
    results.push({ label, got, expected });
}

function throws(label: string, fn: () => unknown): void {
    try {
        fn();
        results.push({ label, got: "no throw", expected: "throw" });
    } catch {
        results.push({ label, got: "threw", expected: "threw" });
    }
}

// ---- best-practices.md: source mutation ----------------------------------------
{
    const arr = [1, 2, 3];
    const seq = Tyneq.from(arr).where((x) => x > 1);
    arr.push(4);
    check("bp/source-mutation", seq.toArray(), [2, 3, 4]);
}

// ---- best-practices.md: gen-object vs gen-function ----------------------------
{
    function* naturals() { let n = 0; while (n < 1000) yield n++; }
    const bad = Tyneq.from(naturals()).take(5);
    check("bp/gen-obj-first-pass", bad.toArray(), [0, 1, 2, 3, 4]);
    check("bp/gen-obj-second-pass", bad.toArray(), []);
    const good = Tyneq.from({ [Symbol.iterator]: naturals }).take(5);
    check("bp/gen-fn-first-pass", good.toArray(), [0, 1, 2, 3, 4]);
    check("bp/gen-fn-second-pass", good.toArray(), [0, 1, 2, 3, 4]);
}

// ---- best-practices.md: backsert semantics ------------------------------------
check("bp/backsert-0", Tyneq.from([1, 2, 3]).backsert(0, [9]).toArray(), [1, 2, 3, 9]);
check("bp/backsert-1", Tyneq.from([1, 2, 3]).backsert(1, [9]).toArray(), [1, 2, 9, 3]);
check("bp/backsert-2", Tyneq.from([1, 2, 3]).backsert(2, [9]).toArray(), [1, 9, 2, 3]);

// ---- operators.md: pairwise ---------------------------------------------------
check("operators/pairwise", Tyneq.range(1, 4).pairwise().toArray(), [[1, 2], [2, 3], [3, 4]]);

// ---- operators.md: scan -------------------------------------------------------
check("operators/scan-sum", Tyneq.range(1, 5).scan(0, (acc, x) => acc + x).toArray(), [1, 3, 6, 10, 15]);
check("operators/scan-prod", Tyneq.range(1, 5).scan(1, (acc, x) => acc * x).toArray(), [1, 2, 6, 24, 120]);

// ---- operators.md: throttle ---------------------------------------------------
check("operators/throttle", Tyneq.range(0, 10).throttle(3).toArray(), [0, 3, 6, 9]);

// ---- operators.md: chunk ------------------------------------------------------
check("operators/chunk-3", Tyneq.range(1, 7).chunk(3).toArray(), [[1, 2, 3], [4, 5, 6], [7]]);
check("operators/chunk-2", Tyneq.range(1, 6).chunk(2).toArray(), [[1, 2], [3, 4], [5, 6]]);

// ---- operators.md: skip/skipLast ----------------------------------------------
check("operators/skip", Tyneq.range(1, 10).skip(7).toArray(), [8, 9, 10]);
check("operators/skipWhile", Tyneq.range(1, 10).skipWhile((x) => x < 5).toArray(), [5, 6, 7, 8, 9, 10]);
check("operators/skipLast", Tyneq.range(1, 5).skipLast(2).toArray(), [1, 2, 3]);

// ---- operators.md: split ------------------------------------------------------
check("operators/split", Tyneq.from([1, 0, 2, 3, 0, 4]).split((x) => x === 0).toArray(), [[1], [2, 3], [4]]);

// ---- operators.md: take -------------------------------------------------------
check("operators/take", Tyneq.range(1, 100).take(5).toArray(), [1, 2, 3, 4, 5]);
check("operators/takeWhile", Tyneq.range(1, 10).takeWhile((x) => x < 5).toArray(), [1, 2, 3, 4]);

// ---- operators.md: defaultIfEmpty ---------------------------------------------
check("operators/defaultIfEmpty-empty", Tyneq.from<number>([]).defaultIfEmpty(0).toArray(), [0]);
check("operators/defaultIfEmpty-nonempty", Tyneq.from([1, 2]).defaultIfEmpty(0).toArray(), [1, 2]);

// ---- operators.md: zip --------------------------------------------------------
{
    const names = Tyneq.from(["Ada", "Linus"]);
    const scores = Tyneq.from([84, 92, 97]);
    check("operators/zip", names.zip(scores, (n, s) => `${n}: ${s}`).toArray(), ["Ada: 84", "Linus: 92"]);
}

// ---- operators.md: reverse ----------------------------------------------------
check("operators/reverse", Tyneq.range(1, 5).reverse().toArray(), [5, 4, 3, 2, 1]);

// ---- operators.md: distinct ---------------------------------------------------
check("operators/distinct", Tyneq.from([1, 2, 2, 3, 1, 4]).distinct().toArray(), [1, 2, 3, 4]);

// ---- operators.md: union/intersect/except -------------------------------------
{
    const a = Tyneq.from([1, 2, 3]);
    const b = Tyneq.from([2, 3, 4]);
    check("operators/union", a.union(b).toArray(), [1, 2, 3, 4]);
    check("operators/intersect", a.intersect(b).toArray(), [2, 3]);
    check("operators/except", a.except(b).toArray(), [1]);
}

// ---- operators.md: indexOf ----------------------------------------------------
{
    const nums = Tyneq.from([10, 20, 30, 40]);
    check("operators/indexOf-basic", nums.indexOf((x) => x > 25), 2);
    check("operators/indexOf-start", nums.indexOf((x) => x > 25, 3), 3);
    check("operators/indexOf-none", nums.indexOf((x) => x > 100), -1);
}

// ---- operators.md: sum/count/countBy ------------------------------------------
check("operators/sum-with-selector", Tyneq.from([1, 2, 3, 4, 5]).sum((x) => x), 15);
check("operators/count-noargs", Tyneq.from([1, 2, 3, 4, 5]).count(), 5);
check("operators/countBy", Tyneq.from([1, 2, 3, 4, 5]).countBy((x) => x > 3), 2);

// ---- operators.md: aggregate --------------------------------------------------
check("operators/aggregate-sum",
    Tyneq.from([1, 2, 3, 4, 5]).aggregate(0, (acc, x) => acc + x, (acc) => acc),
    15
);

// ---- operators.md: sequenceEqual ----------------------------------------------
check("operators/sequenceEqual", Tyneq.from([1, 2, 3, 4, 5]).sequenceEqual([1, 2, 3, 4, 5]), true);

// ---- operators.md: isNullOrEmpty ----------------------------------------------
check("operators/isNullOrEmpty-empty", Tyneq.empty<number>().isNullOrEmpty(), true);
check("operators/isNullOrEmpty-nonempty", Tyneq.from([1, 2, 3]).isNullOrEmpty(), false);

// ---- concepts.md: pipeline ----------------------------------------------------
check("concepts/range-pipeline",
    Tyneq.range(1, 20).where((n) => n % 2 === 0).select((n) => n * n).take(5).toArray(),
    [4, 16, 36, 64, 100]
);

// ---- concepts.md: re-iteration ------------------------------------------------
{
    const query = Tyneq.from([1, 2, 3, 4, 5]).where((n) => n % 2 === 0);
    check("concepts/re-iter-1", query.toArray(), [2, 4]);
    check("concepts/re-iter-2", query.count(), 2);
    check("concepts/re-iter-3", query.toArray(), [2, 4]);
}

// ---- getting-started.md: topCore pipeline -------------------------------------
{
    const people = [
        { name: "Ada",   team: "core",  score: 84 },
        { name: "Linus", team: "infra", score: 92 },
        { name: "Grace", team: "core",  score: 97 },
    ];
    check("getting-started/topCore",
        Tyneq.from(people)
            .where((p) => p.team === "core")
            .orderByDescending((p) => p.score)
            .select((p) => `${p.name} (${p.score})`)
            .toArray(),
        ["Grace (97)", "Ada (84)"]
    );
}

// ---- getting-started.md: factories --------------------------------------------
check("getting-started/range-1-5", Tyneq.range(1, 5).toArray(), [1, 2, 3, 4, 5]);
check("getting-started/enumerate",
    Tyneq.enumerate(["a", "b", "c"]).toArray(),
    [[0, "a"], [1, "b"], [2, "c"]]
);

// ---- grouping.md: groupBy aggregation -----------------------------------------
{
    const people = [
        { name: "Ada",    team: "core",  score: 84 },
        { name: "Linus",  team: "infra", score: 92 },
        { name: "Grace",  team: "core",  score: 97 },
        { name: "Bjarne", team: "infra", score: 78 },
    ];
    check("grouping/groupBy-agg",
        Tyneq.from(people)
            .groupBy(
                (p) => p.team,
                (p) => p.score,
                (team, scores) => ({ team, avg: scores.average((s) => s), count: scores.count() })
            )
            .toArray(),
        [{ team: "core", avg: 90.5, count: 2 }, { team: "infra", avg: 85, count: 2 }]
    );
}

// ---- query-plan.md: optimizer fusion ------------------------------------------
check("qp/optimizer-output",
    Tyneq.from([1, 2, 3]).where((x) => x > 0).where((x) => x < 3).select((x) => x * 2).select((x) => x + 1).toArray(),
    [3, 5]
);

// ---- throws on bad args -------------------------------------------------------
throws("throws/take-negative", () => Tyneq.from([1]).take(-1));
throws("throws/skip-negative", () => Tyneq.from([1]).skip(-1));
throws("throws/chunk-zero", () => Tyneq.from([1]).chunk(0));

// ---- output -------------------------------------------------------------------
let failed = 0;
for (const r of results) {
    const ok = JSON.stringify(r.got) === JSON.stringify(r.expected);
    const marker = ok ? "OK  " : "FAIL";
    console.log(`${marker}  ${r.label}`);
    if (!ok) {
        console.log("   got:      " + JSON.stringify(r.got));
        console.log("   expected: " + JSON.stringify(r.expected));
        failed++;
    }
}
console.log(`\n${results.length - failed}/${results.length} passed`);
if (fatal.length > 0) {
    console.log("\nFatal errors:");
    for (const m of fatal) console.log("  " + m);
}
process.exit(failed === 0 ? 0 : 1);
