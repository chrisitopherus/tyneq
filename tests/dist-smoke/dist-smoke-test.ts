// Post-build smoke test that imports the actual published dist output (ESM and CJS) and
// exercises a basic pipeline plus a decorator-based plugin registration against each.
// This exists because tsup/esbuild transforms Stage 3 decorator syntax into helper-function
// calls (__decorateClass, __decorateElement) at build time - a divergence between direct tsc
// emission and the esbuild-based dist that unit tests (which import src/ directly via a
// vitest alias, never dist/) cannot catch.
//
// Run after `npm run build`, via `npm run test:dist`. Uses tsx (esbuild-based) rather than
// plain node so this script's own @operator decorator syntax is transformed the same way a
// real consumer's bundler would.

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "..", "dist");

let failures = 0;

function check(label: string, condition: boolean): void {
    if (condition) {
        console.log(`  ok - ${label}`);
    } else {
        console.error(`  FAIL - ${label}`);
        failures++;
    }
}

async function runEsmChecks(): Promise<void> {
    console.log("ESM (dist/index.js)");
    const esmPath = pathToFileURL(path.join(distDir, "index.js")).href;
    const { Tyneq, operator, TyneqEnumerator, OperatorRegistry } = await import(esmPath);

    check(
        "Tyneq.from/where/select pipeline produces correct output",
        Tyneq.from([1, 2, 3, 4, 5]).where((x: number) => x % 2 === 0).select((x: number) => x * 10).toArray()
            .join(",") === "20,40"
    );

    check("sequence is re-iterable (two independent toArray() calls match)", (() => {
        const seq = Tyneq.from([1, 2, 3]).select((x: number) => x * 2);
        return seq.toArray().join(",") === seq.toArray().join(",");
    })());

    const operatorName = `__distSmokeEsm_${Date.now()}`;

    @operator(operatorName, "streaming")
    class SmokeEnumerator extends TyneqEnumerator {
        public constructor(source: unknown) {
            super(source);
        }
        protected handleNext(): unknown {
            return (this as any).sourceEnumerator.next();
        }
    }
    void SmokeEnumerator;

    check(
        "@operator decorator registers and the operator is callable",
        (Tyneq.from([1, 2, 3]) as any)[operatorName]().toArray().join(",") === "1,2,3"
    );

    check("OperatorRegistry sees the decorator-registered operator", OperatorRegistry.hasOperator(operatorName));

    OperatorRegistry.unregister(operatorName);
}

function runCjsChecks(): void {
    console.log("CJS (dist/index.cjs)");
    const require = createRequire(import.meta.url);
    const cjsPath = path.join(distDir, "index.cjs");
    const { Tyneq, createOperator, OperatorRegistry } = require(cjsPath);

    check(
        "Tyneq.from/where/select pipeline produces correct output",
        Tyneq.from([1, 2, 3, 4, 5]).where((x: number) => x % 2 === 0).select((x: number) => x * 10).toArray()
            .join(",") === "20,40"
    );

    check("sequence is re-iterable (two independent toArray() calls match)", (() => {
        const seq = Tyneq.from([1, 2, 3]).select((x: number) => x * 2);
        return seq.toArray().join(",") === seq.toArray().join(",");
    })());

    const operatorName = `__distSmokeCjs_${Date.now()}`;

    createOperator({
        name: operatorName,
        category: "streaming",
        factory(source: Iterable<unknown>) {
            return { getEnumerator: () => source[Symbol.iterator]() };
        },
    });

    check(
        "createOperator registers and the operator is callable",
        (Tyneq.from([1, 2, 3]) as any)[operatorName]().toArray().join(",") === "1,2,3"
    );

    check(
        "OperatorRegistry sees the functional-API-registered operator",
        OperatorRegistry.hasOperator(operatorName)
    );

    OperatorRegistry.unregister(operatorName);
}

async function main(): Promise<void> {
    if (!existsSync(distDir)) {
        console.error(`dist/ not found at ${distDir}. Run "npm run build" first.`);
        process.exit(1);
    }

    await runEsmChecks();
    runCjsChecks();

    if (failures > 0) {
        console.error(`\n${failures} check(s) failed.`);
        process.exit(1);
    }

    console.log("\nAll dist smoke checks passed.");
}

main();
