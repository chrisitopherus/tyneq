import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        "index": "src/index.ts",
        "plugin/index": "src/plugin/index.ts",
        "utility/index": "src/utility/index.ts",
    },
    format: ["esm", "cjs"],
    tsconfig: "tsconfig.build.json",
    dts: true,
    sourcemap: true,
    target: "es2017",
    platform: "node",
    clean: true,
    splitting: true,
});
