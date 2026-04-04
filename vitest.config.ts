import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "tyneq/plugin": resolve(__dirname, "src/plugin/index.ts"),
      "tyneq/utility": resolve(__dirname, "src/utility/index.ts"),
      "tyneq": resolve(__dirname, "src/index.ts"),
    }
  },
  test: {
    include: ["tests/**/*.spec.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/dev.ts"]
    }
  }
});
