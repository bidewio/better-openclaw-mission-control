import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		{
			name: "local-api-server",
			configureServer(server) {
				// Claude Code session scanner endpoint
				server.middlewares.use("/api/claude-sessions", async (_req, res) => {
					try {
						const { scanClaudeSessions } = await import("./src/lib/claude-sessions");
						const sessions = scanClaudeSessions();
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({ ok: true, sessions }));
					} catch (err: any) {
						res.statusCode = 500;
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({ ok: false, error: err.message }));
					}
				});

				// Local file server for images/PDFs
				server.middlewares.use("/api/local-file", (req, res) => {
					const url = new URL(req.url || "", "http://localhost");
					const filePath = url.searchParams.get("path");
					if (!filePath || !filePath.startsWith("/")) {
						res.statusCode = 400;
						res.end("Missing or invalid path");
						return;
					}
					const ext = path.extname(filePath).toLowerCase();
					const mimeTypes: Record<string, string> = {
						".png": "image/png",
						".jpg": "image/jpeg",
						".jpeg": "image/jpeg",
						".gif": "image/gif",
						".svg": "image/svg+xml",
						".webp": "image/webp",
						".pdf": "application/pdf",
					};
					const contentType = mimeTypes[ext] || "application/octet-stream";
					try {
						const data = fs.readFileSync(filePath);
						res.setHeader("Content-Type", contentType);
						res.setHeader("Cache-Control", "public, max-age=3600");
						res.end(data);
					} catch {
						res.statusCode = 404;
						res.end("File not found");
					}
				});
			},
		},
	],
	server: {
		proxy: {
			"/hooks": {
				target: "http://127.0.0.1:18789",
				changeOrigin: true,
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
