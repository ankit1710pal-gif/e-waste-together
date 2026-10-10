import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: [
      "shared/**/*.test.ts",
      "amplify/**/*.test.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
  },
});
