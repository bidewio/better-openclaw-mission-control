// Mission Control Hook Handler for OpenClaw
// Captures agent lifecycle events and sends them to the Mission Control webhook endpoint

const CODING_TOOLS = ["edit", "exec", "bash", "run", "process"];
const DOC_EXTENSIONS = [".md", ".txt", ".rst", ".doc"];
const CODE_EXTENSIONS = [
	".ts",
	".js",
	".tsx",
	".jsx",
	".py",
	".rs",
	".go",
	".java",
	".c",
	".cpp",
	".yml",
	".yaml",
	".json",
	".html",
	".css",
];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];

function detectDocType(path) {
	if (!path) return "document";
	const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
	if (CODE_EXTENSIONS.includes(ext)) return "code";
	if (IMAGE_EXTENSIONS.includes(ext)) return "image";
	if (DOC_EXTENSIONS.includes(ext)) return "document";
	return "document";
}

function extractFilePath(text) {
	if (!text) return null;
	// Match common file path patterns
	const patterns = [
		/(?:^|\s)(\/[\w./-]+\.\w+)/,
		/(?:^|\s)([\w./-]+\/[\w./-]+\.\w+)/,
		/\`([\w./-]+\.\w+)\`/,
	];
	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match?.[1]) return match[1];
	}
	return null;
}

function summarizePrompt(prompt) {
	if (!prompt) return null;
	const cleaned = prompt.trim();
	const firstLine = cleaned.split("\n")[0]?.trim() || cleaned;
	return firstLine.length <= 120 ? firstLine : firstLine.slice(0, 117) + "...";
}

export default function handler({ config, context }) {
	const webhookUrl =
		config.env?.MISSION_CONTROL_URL ||
		process.env.MISSION_CONTROL_URL ||
		"http://127.0.0.1:3211/openclaw/event";

	// Track sessions to extract prompts and responses
	const sessions = new Map();

	async function postEvent(payload) {
		try {
			const res = await fetch(webhookUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				console.error(`[mission-control] POST failed: ${res.status} ${res.statusText}`);
			}
		} catch (err) {
			console.error(`[mission-control] POST error:`, err?.message || err);
		}
	}

	// Register the agent event listener
	context.onAgentEvent?.((event) => {
		if (!event) return;

		const { runId, sessionKey, stream, phase, agentId, toolName, type: eventType } = event;

		if (!runId) return;

		// Initialize session tracking
		if (!sessions.has(runId)) {
			sessions.set(runId, {
				prompt: null,
				response: null,
				source: null,
			});
		}
		const session = sessions.get(runId);

		// Capture user prompt from human messages
		if (stream === "messages" && event.role === "human") {
			const content = typeof event.content === "string" ? event.content : event.content?.[0]?.text;
			if (content) {
				session.prompt = summarizePrompt(content);
				session.source = event.source || null;
			}
		}

		// Capture assistant response
		if (stream === "messages" && event.role === "assistant") {
			const content = typeof event.content === "string" ? event.content : event.content?.[0]?.text;
			if (content) {
				session.response = content;
			}
		}

		// Lifecycle events
		if (stream === "lifecycle") {
			if (phase === "start") {
				postEvent({
					runId,
					action: "start",
					sessionKey: sessionKey || null,
					agentId: agentId || null,
					prompt: session.prompt,
					source: session.source,
					timestamp: new Date().toISOString(),
				});
			} else if (phase === "end") {
				postEvent({
					runId,
					action: "end",
					sessionKey: sessionKey || null,
					agentId: agentId || null,
					response: session.response,
					timestamp: new Date().toISOString(),
				});
				// Cleanup session
				sessions.delete(runId);
			} else if (phase === "error") {
				postEvent({
					runId,
					action: "error",
					sessionKey: sessionKey || null,
					agentId: agentId || null,
					error: event.error || event.message || "Unknown error",
					timestamp: new Date().toISOString(),
				});
				sessions.delete(runId);
			}
		}

		// Tool usage events
		if (stream === "tools" || eventType === "tool:start") {
			const message = toolName ? `Using tool: ${toolName}` : event.message || "Tool operation";

			postEvent({
				runId,
				action: "progress",
				sessionKey: sessionKey || null,
				agentId: agentId || null,
				message,
				eventType: eventType || "tool:start",
				timestamp: new Date().toISOString(),
			});
		}

		// Document creation events (file writes, document generation)
		if ((eventType === "file:write" || eventType === "document:create") && event.path) {
			const docType = detectDocType(event.path);
			postEvent({
				runId,
				action: "document",
				sessionKey: sessionKey || null,
				agentId: agentId || null,
				document: {
					title: event.path.split("/").pop() || event.path,
					content: event.content || "",
					type: docType,
					path: event.path,
				},
				timestamp: new Date().toISOString(),
			});
		}
	});
}
