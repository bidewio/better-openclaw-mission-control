import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthTenantId } from "./lib/tenant";

/**
 * Sync Claude Code sessions from the local scanner into Convex.
 * Called by the frontend after fetching scan results from the Vite dev middleware.
 */
export const syncSessions = mutation({
	args: {
		sessions: v.array(
			v.object({
				sessionId: v.string(),
				projectSlug: v.string(),
				projectPath: v.optional(v.string()),
				model: v.optional(v.string()),
				gitBranch: v.optional(v.string()),
				userMessages: v.number(),
				assistantMessages: v.number(),
				toolUses: v.number(),
				inputTokens: v.number(),
				outputTokens: v.number(),
				estimatedCost: v.number(),
				firstMessageAt: v.optional(v.string()),
				lastMessageAt: v.optional(v.string()),
				lastUserPrompt: v.optional(v.string()),
				isActive: v.boolean(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const now = Date.now();

		// Mark all existing sessions as inactive before upserting
		const existing = await ctx.db
			.query("claudeSessions")
			.withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
			.collect();

		for (const session of existing) {
			if (session.isActive) {
				await ctx.db.patch(session._id, { isActive: false });
			}
		}

		// Upsert each scanned session
		let upserted = 0;
		for (const s of args.sessions) {
			const existingSession = await ctx.db
				.query("claudeSessions")
				.withIndex("by_session", (q) => q.eq("tenantId", tenantId).eq("sessionId", s.sessionId))
				.first();

			if (existingSession) {
				await ctx.db.patch(existingSession._id, {
					...s,
					projectPath: s.projectPath ?? undefined,
					model: s.model ?? undefined,
					gitBranch: s.gitBranch ?? undefined,
					firstMessageAt: s.firstMessageAt ?? undefined,
					lastMessageAt: s.lastMessageAt ?? undefined,
					lastUserPrompt: s.lastUserPrompt ?? undefined,
					scannedAt: now,
				});
			} else {
				await ctx.db.insert("claudeSessions", {
					...s,
					projectPath: s.projectPath ?? undefined,
					model: s.model ?? undefined,
					gitBranch: s.gitBranch ?? undefined,
					firstMessageAt: s.firstMessageAt ?? undefined,
					lastMessageAt: s.lastMessageAt ?? undefined,
					lastUserPrompt: s.lastUserPrompt ?? undefined,
					scannedAt: now,
					tenantId,
				});
			}
			upserted++;
		}

		return { upserted, active: args.sessions.filter((s) => s.isActive).length };
	},
});

/** List all Claude Code sessions for the current tenant. */
export const listSessions = query({
	args: {
		activeOnly: v.optional(v.boolean()),
		project: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		let sessions = await ctx.db
			.query("claudeSessions")
			.withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
			.collect();

		if (args.activeOnly) {
			sessions = sessions.filter((s) => s.isActive);
		}
		if (args.project) {
			sessions = sessions.filter((s) => s.projectSlug.includes(args.project!));
		}

		// Sort by last message time (most recent first)
		sessions.sort((a, b) => {
			const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
			const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
			return bTime - aTime;
		});

		return sessions;
	},
});

/** Get aggregate stats across all sessions. */
export const getSessionStats = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await requireAuthTenantId(ctx);
		const sessions = await ctx.db
			.query("claudeSessions")
			.withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
			.collect();

		const totalSessions = sessions.length;
		const activeSessions = sessions.filter((s) => s.isActive).length;
		const totalCost = sessions.reduce((sum, s) => sum + s.estimatedCost, 0);
		const totalInputTokens = sessions.reduce((sum, s) => sum + s.inputTokens, 0);
		const totalOutputTokens = sessions.reduce((sum, s) => sum + s.outputTokens, 0);
		const totalToolUses = sessions.reduce((sum, s) => sum + s.toolUses, 0);

		// Unique projects
		const projects = new Set(sessions.map((s) => s.projectSlug));

		return {
			totalSessions,
			activeSessions,
			totalCost: Math.round(totalCost * 100) / 100,
			totalInputTokens,
			totalOutputTokens,
			totalToolUses,
			uniqueProjects: projects.size,
		};
	},
});
