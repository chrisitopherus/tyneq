/**
 * Ordering and grouping example.
 *
 * Demonstrates multi-key sorting, groupBy, join, and comparers.
 * Run with: npx tsx examples/02-ordering-and-grouping.ts
 */
import { Tyneq, TyneqComparer } from "../src/index";

const people = [
    { name: "Grace",  team: "core",  score: 97 },
    { name: "Ada",    team: "core",  score: 84 },
    { name: "Linus",  team: "infra", score: 92 },
    { name: "Bjarne", team: "infra", score: 78 },
    { name: "Guido",  team: "core",  score: 84 },
];

// ---- Multi-key sort: team ascending, score descending -------------------------
const sorted = Tyneq.from(people)
    .orderBy((p) => p.team)
    .thenByDescending((p) => p.score)
    .select((p) => `${p.team}/${p.name}:${p.score}`)
    .toArray();

console.log("Sorted by team then score desc:");
sorted.forEach((s) => console.log(" ", s));
// core/Grace:97  core/Ada:84  core/Guido:84  infra/Linus:92  infra/Bjarne:78

// ---- Case-insensitive sort ---------------------------------------------------
const words = Tyneq.from(["banana", "Apple", "cherry", "apricot"]);
const caseInsensitive = words
    .orderBy((w) => w, TyneqComparer.caseInsensitiveComparer)
    .toArray();
console.log("Case-insensitive sort:", caseInsensitive);
// ["Apple", "apricot", "banana", "cherry"]

// ---- groupBy: team averages --------------------------------------------------
const teamStats = Tyneq.from(people)
    .groupBy(
        (p) => p.team,
        (p) => p.score,
        (team, scores) => ({
            team,
            avg: Math.round(scores.average((s) => s) * 10) / 10,
            count: scores.count(),
        })
    )
    .toArray();

console.log("Team stats:");
teamStats.forEach((s) => console.log(`  ${s.team}: avg=${s.avg} count=${s.count}`));

// ---- join -------------------------------------------------------------------
const teams = [
    { id: "core",  label: "Core Platform" },
    { id: "infra", label: "Infrastructure" },
];

const joined = Tyneq.from(people)
    .join(
        teams,
        (p) => p.team,
        (t) => t.id,
        (p, t) => `${p.name} -> ${t.label}`
    )
    .toArray();

console.log("Joined with team labels:");
joined.forEach((s) => console.log(" ", s));
