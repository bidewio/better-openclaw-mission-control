import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/**/*.test.ts", "src/**/*.test.tsx", "convex/**/*.test.ts"],
		setupFiles: ["./src/test/setup.ts"],
		coverage: {
			include: ["src/**/*.ts", "src/**/*.tsx", "convex/**/*.ts"],
			exclude: ["**/*.test.ts", "**/*.test.tsx", "convex/_generated/**", "src/main.tsx"],
		},
	},
});
