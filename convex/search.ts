import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthTenantId } from "./lib/tenant";

/** Global search across agents, tasks, documents, and activities. */
export const globalSearch = query({
	args: {
		query: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const q = args.query.toLowerCase().trim();
		if (q.length < 2) return [];

		const limit = Math.min(args.limit ?? 20, 50);
		const results: Array<{
			type: string;
			id: string;
			title: string;
			subtitle?: string;
			excerpt?: string;
			relevance: number;
			createdAt: number;
		}> = [];

		// Search agents
		const agents = await ctx.db
			.query("agents")
			.withIndex("by_tenant", (qb) => qb.eq("tenantId", tenantId))
			.collect();
		for (const agent of agents) {
			const nameMatch = agent.name.toLowerCase().includes(q);
			const roleMatch = agent.role.toLowerCase().includes(q);
			if (nameMatch || roleMatch) {
				results.push({
					type: "agent",
					id: agent._id,
					title: agent.name,
					subtitle: agent.role,
					excerpt: `Status: ${agent.status} | Level: ${agent.level}`,
					relevance: nameMatch ? 2 : 1,
					createdAt: agent._creationTime,
				});
			}
		}

		// Search tasks
		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_tenant", (qb) => qb.eq("tenantId", tenantId))
			.collect();
		for (const task of tasks) {
			const titleMatch = task.title.toLowerCase().includes(q);
			const descMatch = task.description.toLowerCase().includes(q);
			const tagMatch = task.tags.some((t) => t.toLowerCase().includes(q));
			if (titleMatch || descMatch || tagMatch) {
				results.push({
					type: "task",
					id: task._id,
					title: task.title,
					subtitle: task.status,
					excerpt: truncateMatch(task.description, q),
					relevance: titleMatch ? 2 : 1,
					createdAt: task._creationTime,
				});
			}
		}

		// Search documents
		const documents = await ctx.db
			.query("documents")
			.withIndex("by_tenant", (qb) => qb.eq("tenantId", tenantId))
			.collect();
		for (const doc of documents) {
			const titleMatch = doc.title.toLowerCase().includes(q);
			const contentMatch = doc.content.toLowerCase().includes(q);
			if (titleMatch || contentMatch) {
				results.push({
					type: "document",
					id: doc._id,
					title: doc.title,
					subtitle: doc.type,
					excerpt: truncateMatch(doc.content, q),
					relevance: titleMatch ? 2 : 1,
					createdAt: doc._creationTime,
				});
			}
		}

		// Search activities
		const activities = await ctx.db
			.query("activities")
			.withIndex("by_tenant", (qb) => qb.eq("tenantId", tenantId))
			.order("desc")
			.take(500);
		for (const activity of activities) {
			if (activity.message.toLowerCase().includes(q)) {
				results.push({
					type: "activity",
					id: activity._id,
					title: activity.message.slice(0, 80),
					subtitle: activity.type,
					relevance: 1,
					createdAt: activity._creationTime,
				});
			}
		}

		// Sort by relevance then recency
		results.sort((a, b) => {
			if (a.relevance !== b.relevance) return b.relevance - a.relevance;
			return b.createdAt - a.createdAt;
		});

		return results.slice(0, limit);
	},
});

/** Extract context-aware excerpt around the match. */
function truncateMatch(text: string, query: string, maxLen = 120): string {
	const lower = text.toLowerCase();
	const idx = lower.indexOf(query.toLowerCase());
	if (idx === -1) return text.slice(0, maxLen);
	const start = Math.max(0, idx - 40);
	const end = Math.min(text.length, idx + query.length + 80);
	let excerpt = text.slice(start, end);
	if (start > 0) excerpt = "..." + excerpt;
	if (end < text.length) excerpt = excerpt + "...";
	return excerpt;
}
