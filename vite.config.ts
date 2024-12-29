import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { join } from "path";
import { chunkSplitPlugin } from "vite-plugin-chunk-split";

// https://vite.dev/config/
export default defineConfig({
	root: join(__dirname, "src/renderer"),
	build: {
		outDir: join(__dirname, "dist/renderer"),
		emptyOutDir: true
	},
	plugins: [
		react(),
		tsconfigPaths(),
		chunkSplitPlugin({
			strategy: "single-vendor",
			customChunk: (args) => {
				// files into pages directory is export in single files
				const { id } = args;
				if (id.includes("node_modules")) {
					return "vendor";
				} else {
					return "main";
				}
			}
		})
	],
	base: ""
});
