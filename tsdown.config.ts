import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts", "src/plugin/index.ts", "src/utility/index.ts"],
    format: ["esm", "cjs"],
    tsconfig: "tsconfig.build.json",
    dts: true,
    sourcemap: true,
    target: "es2022",
    platform: "node",
    hash: false,
    clean: true,
    fixedExtension: false,
});
