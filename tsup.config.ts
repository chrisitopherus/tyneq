import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts", "src/plugin/index.ts", "src/utility/index.ts"],
    format: ["esm", "cjs"],
    tsconfig: "tsconfig.build.json",
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    target: "es2019"
});