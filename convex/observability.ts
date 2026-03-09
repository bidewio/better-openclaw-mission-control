import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthTenantId } from "./lib/tenant";

/** List agent events with optional filters. */
export const listAgentEvents = query({
	args: {
		agentId: v.optional(v.id("agents")),
		taskId: v.optional(v.id("tasks")),
		eventType: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const cap = args.limit ?? 100;

		let q;
		if (args.agentId) {
			q = ctx.db
				.query("agentEvents")
				.withIndex("by_agent", (idx) => idx.eq("tenantId", tenantId).eq("agentId", args.agentId!))
				.order("desc");
		} else {
			q = ctx.db
				.query("agentEvents")
				.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
				.order("desc");
		}

		if (args.taskId || args.eventType) {
			q = q.filter((f) => {
				const filters = [];
				if (args.taskId) filters.push(f.eq(f.field("taskId"), args.taskId));
				if (args.eventType) filters.push(f.eq(f.field("eventType"), args.eventType));
				return f.and(...filters);
			});
		}

		const events = await q.take(cap);

		// Enrich with agent name
		return Promise.all(
			events.map(async (e) => {
				const agent = await ctx.db.get(e.agentId);
				return { ...e, agentName: agent?.name ?? "Unknown" };
			}),
		);
	},
});

/** Aggregate metrics for the overview cards. */
export const getAgentMetrics = query({
	args: { timeRangeHours: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const windowMs = (args.timeRangeHours ?? 24) * 60 * 60 * 1000;
		const cutoff = Date.now() - windowMs;

		const events = await ctx.db
			.query("agentEvents")
			.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
			.filter((f) => f.gte(f.field("_creationTime"), cutoff))
			.collect();

		const totalEvents = events.length;
		const errors = events.filter((e) => e.eventType === "error").length;
		const totalCostCents = events.reduce((sum, e) => sum + (e.costCents ?? 0), 0);
		const completions = events.filter((e) => e.eventType === "completion");
		const avgDurationMs =
			completions.length > 0
				? completions.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) / completions.length
				: 0;

		return {
			totalEvents,
			errors,
			totalCostCents,
			avgDurationMs,
			windowHours: args.timeRangeHours ?? 24,
		};
	},
});

/** Tool usage breakdown — count of events per toolName. */
export const getToolUsageBreakdown = query({
	args: { agentId: v.optional(v.id("agents")) },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);

		let q;
		if (args.agentId) {
			q = ctx.db
				.query("agentEvents")
				.withIndex("by_agent", (idx) => idx.eq("tenantId", tenantId).eq("agentId", args.agentId!));
		} else {
			q = ctx.db.query("agentEvents").withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId));
		}

		const events = await q.filter((f) => f.eq(f.field("eventType"), "tool_call")).collect();

		const counts: Record<string, number> = {};
		for (const e of events) {
			const name = e.toolName ?? "unknown";
			counts[name] = (counts[name] ?? 0) + 1;
		}

		return Object.entries(counts)
			.map(([tool, count]) => ({ tool, count }))
			.sort((a, b) => b.count - a.count);
	},
});

/** Daily cost buckets for the cost chart. */
export const getCostTimeline = query({
	args: { days: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const numDays = args.days ?? 7;
		const cutoff = Date.now() - numDays * 24 * 60 * 60 * 1000;

		const events = await ctx.db
			.query("agentEvents")
			.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
			.filter((f) => f.gte(f.field("_creationTime"), cutoff))
			.collect();

		const buckets: Record<string, number> = {};
		for (const e of events) {
			const day = new Date(e._creationTime).toISOString().slice(0, 10);
			buckets[day] = (buckets[day] ?? 0) + (e.costCents ?? 0);
		}

		return Object.entries(buckets)
			.map(([date, costCents]) => ({ date, costCents }))
			.sort((a, b) => a.date.localeCompare(b.date));
	},
});

/** Record a new agent event (called by the gateway / agent runtime). */
export const recordAgentEvent = mutation({
	args: {
		agentId: v.id("agents"),
		taskId: v.optional(v.id("tasks")),
		eventType: v.string(),
		toolName: v.optional(v.string()),
		durationMs: v.optional(v.number()),
		inputTokens: v.optional(v.number()),
		outputTokens: v.optional(v.number()),
		costCents: v.optional(v.number()),
		errorMessage: v.optional(v.string()),
		metadata: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		return ctx.db.insert("agentEvents", { ...args, tenantId });
	},
});

/** List alert rules. */
export const listAlertRules = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await requireAuthTenantId(ctx);
		return ctx.db
			.query("alertRules")
			.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
			.collect();
	},
});

/** Create or update an alert rule. */
export const upsertAlertRule = mutation({
	args: {
		id: v.optional(v.id("alertRules")),
		name: v.string(),
		condition: v.string(),
		threshold: v.number(),
		windowMinutes: v.number(),
		enabled: v.boolean(),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		if (args.id) {
			await ctx.db.patch(args.id, {
				name: args.name,
				condition: args.condition,
				threshold: args.threshold,
				windowMinutes: args.windowMinutes,
				enabled: args.enabled,
			});
			return args.id;
		}
		return ctx.db.insert("alertRules", {
			name: args.name,
			condition: args.condition,
			threshold: args.threshold,
			windowMinutes: args.windowMinutes,
			enabled: args.enabled,
			tenantId,
		});
	},
});

/** Delete an alert rule. */
export const deleteAlertRule = mutation({
	args: { id: v.id("alertRules") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});
