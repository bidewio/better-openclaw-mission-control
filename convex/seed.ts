import { mutation } from "./_generated/server";

const TENANT_ID = "default";

export const run = mutation({
	handler: async (ctx) => {
		// Check if data already exists
		const existingAgents = await ctx.db
			.query("agents")
			.withIndex("by_tenant", (q) => q.eq("tenantId", TENANT_ID))
			.first();
		if (existingAgents) {
			console.log("Seed data already exists, skipping.");
			return;
		}

		// 1. Create agents
		const loki = await ctx.db.insert("agents", {
			name: "Loki",
			role: "Mischief & Tactics",
			status: "active",
			level: "LEAD",
			avatar: "🦊",
			tenantId: TENANT_ID,
		});
		const thor = await ctx.db.insert("agents", {
			name: "Thor",
			role: "Infrastructure",
			status: "idle",
			level: "SPC",
			avatar: "⚡",
			tenantId: TENANT_ID,
		});
		const heimdall = await ctx.db.insert("agents", {
			name: "Heimdall",
			role: "Monitoring",
			status: "active",
			level: "SPC",
			avatar: "👁️",
			tenantId: TENANT_ID,
		});
		const freya = await ctx.db.insert("agents", {
			name: "Freya",
			role: "Design & Frontend",
			status: "idle",
			level: "INT",
			avatar: "🌸",
			tenantId: TENANT_ID,
		});

		// 2. Create tasks
		const task1 = await ctx.db.insert("tasks", {
			title: "Set up CI/CD pipeline",
			description:
				"Configure GitHub Actions for automated testing and deployment of the monorepo packages.",
			status: "in_progress",
			assigneeIds: [thor],
			tags: ["infra", "ci"],
			borderColor: "#3b82f6",
			tenantId: TENANT_ID,
		});
		const task2 = await ctx.db.insert("tasks", {
			title: "Design dashboard layout",
			description: "Create wireframes and implement the main dashboard layout with kanban board.",
			status: "done",
			assigneeIds: [freya],
			tags: ["design", "ui"],
			borderColor: "#a855f7",
			tenantId: TENANT_ID,
		});
		const task3 = await ctx.db.insert("tasks", {
			title: "Implement agent monitoring",
			description: "Build real-time agent status monitoring and health check dashboard.",
			status: "review",
			assigneeIds: [heimdall, loki],
			tags: ["monitoring", "agents"],
			borderColor: "#f97316",
			tenantId: TENANT_ID,
		});
		const task4 = await ctx.db.insert("tasks", {
			title: "API rate limiting",
			description: "Implement rate limiting for the webhook endpoint and API routes.",
			status: "inbox",
			assigneeIds: [],
			tags: ["api", "security"],
			tenantId: TENANT_ID,
		});
		const task5 = await ctx.db.insert("tasks", {
			title: "OpenClaw hook integration",
			description: "Build and test the OpenClaw hook handler for lifecycle event tracking.",
			status: "assigned",
			assigneeIds: [loki],
			tags: ["openclaw", "integration"],
			borderColor: "#10b981",
			tenantId: TENANT_ID,
		});

		// 3. Create messages
		await ctx.db.insert("messages", {
			taskId: task1,
			fromAgentId: thor,
			content: "🚀 **Started** - Setting up GitHub Actions workflows.",
			attachments: [],
			tenantId: TENANT_ID,
		});
		await ctx.db.insert("messages", {
			taskId: task1,
			fromAgentId: thor,
			content: "🔧 Using tool: exec\n\nConfiguring workflow YAML for the monorepo build matrix.",
			attachments: [],
			tenantId: TENANT_ID,
		});
		await ctx.db.insert("messages", {
			taskId: task2,
			fromAgentId: freya,
			content:
				"✅ **Completed** in **4m 32s**\n\nDashboard layout with kanban board is ready for review.",
			attachments: [],
			tenantId: TENANT_ID,
		});
		await ctx.db.insert("messages", {
			taskId: task3,
			fromAgentId: heimdall,
			content:
				"❓ **Needs Input** in **12m 5s**\n\nShould we poll agent status every 5s or use WebSocket push?",
			attachments: [],
			tenantId: TENANT_ID,
		});

		// 4. Create activities
		await ctx.db.insert("activities", {
			type: "status_update",
			agentId: thor,
			message: 'started "Set up CI/CD pipeline"',
			targetId: task1,
			tenantId: TENANT_ID,
		});
		await ctx.db.insert("activities", {
			type: "status_update",
			agentId: freya,
			message: 'completed "Design dashboard layout" in 4m 32s',
			targetId: task2,
			tenantId: TENANT_ID,
		});
		await ctx.db.insert("activities", {
			type: "status_update",
			agentId: heimdall,
			message: 'needs input on "Implement agent monitoring"',
			targetId: task3,
			tenantId: TENANT_ID,
		});
		await ctx.db.insert("activities", {
			type: "message",
			agentId: loki,
			message: 'commented on "OpenClaw hook integration"',
			targetId: task5,
			tenantId: TENANT_ID,
		});

		// 5. Create a sample document
		await ctx.db.insert("documents", {
			title: "ci-workflow.yml",
			content:
				"name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: pnpm/action-setup@v2\n      - run: pnpm install\n      - run: pnpm build\n      - run: pnpm test",
			type: "code",
			path: ".github/workflows/ci.yml",
			taskId: task1,
			createdByAgentId: thor,
			tenantId: TENANT_ID,
		});

		console.log("✅ Seed data created successfully.");
	},
});
