import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthTenantId } from "./lib/tenant";

/** List audit log entries with optional filters. */
export const listAuditLog = query({
	args: {
		resourceType: v.optional(v.string()),
		actorType: v.optional(v.string()),
		piiOnly: v.optional(v.boolean()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const cap = args.limit ?? 100;

		let q;
		if (args.resourceType) {
			q = ctx.db
				.query("auditLog")
				.withIndex("by_resource", (idx) =>
					idx.eq("tenantId", tenantId).eq("resourceType", args.resourceType!),
				)
				.order("desc");
		} else {
			q = ctx.db
				.query("auditLog")
				.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
				.order("desc");
		}

		if (args.actorType || args.piiOnly) {
			q = q.filter((f) => {
				const filters = [];
				if (args.actorType) filters.push(f.eq(f.field("actorType"), args.actorType));
				if (args.piiOnly) filters.push(f.eq(f.field("piiDetected"), true));
				return f.and(...filters);
			});
		}

		return q.take(cap);
	},
});

/** Record an audit entry. */
export const recordAuditEntry = mutation({
	args: {
		action: v.string(),
		actorType: v.string(),
		actorId: v.string(),
		actorName: v.string(),
		resourceType: v.string(),
		resourceId: v.optional(v.string()),
		details: v.optional(v.string()),
		ipAddress: v.optional(v.string()),
		piiDetected: v.optional(v.boolean()),
		piiFields: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		return ctx.db.insert("auditLog", { ...args, tenantId });
	},
});

/** List compliance policies. */
export const listPolicies = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await requireAuthTenantId(ctx);
		return ctx.db
			.query("compliancePolicies")
			.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
			.collect();
	},
});

/** Create or update a policy. */
export const upsertPolicy = mutation({
	args: {
		id: v.optional(v.id("compliancePolicies")),
		name: v.string(),
		description: v.string(),
		type: v.string(),
		enabled: v.boolean(),
		config: v.string(),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		if (args.id) {
			await ctx.db.patch(args.id, {
				name: args.name,
				description: args.description,
				type: args.type,
				enabled: args.enabled,
				config: args.config,
			});
			return args.id;
		}
		return ctx.db.insert("compliancePolicies", {
			name: args.name,
			description: args.description,
			type: args.type,
			enabled: args.enabled,
			config: args.config,
			violationCount: 0,
			tenantId,
		});
	},
});

/** Toggle a policy on/off. */
export const togglePolicy = mutation({
	args: { id: v.id("compliancePolicies"), enabled: v.boolean() },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { enabled: args.enabled });
	},
});

/** Delete a policy. */
export const deletePolicy = mutation({
	args: { id: v.id("compliancePolicies") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

/** PII detection summary — count of PII detections by field type. */
export const getPiiSummary = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await requireAuthTenantId(ctx);
		const entries = await ctx.db
			.query("auditLog")
			.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
			.filter((f) => f.eq(f.field("piiDetected"), true))
			.collect();

		const fieldCounts: Record<string, number> = {};
		let totalPiiEntries = 0;
		for (const entry of entries) {
			totalPiiEntries++;
			for (const field of entry.piiFields ?? []) {
				fieldCounts[field] = (fieldCounts[field] ?? 0) + 1;
			}
		}

		return {
			totalPiiEntries,
			fields: Object.entries(fieldCounts)
				.map(([field, count]) => ({ field, count }))
				.sort((a, b) => b.count - a.count),
		};
	},
});

/** Compliance score — % of enabled policies with 0 violations. */
export const getComplianceScore = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await requireAuthTenantId(ctx);
		const policies = await ctx.db
			.query("compliancePolicies")
			.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
			.collect();

		const enabled = policies.filter((p) => p.enabled);
		if (enabled.length === 0) return { score: 100, passing: 0, total: 0, totalViolations: 0 };

		const passing = enabled.filter((p) => (p.violationCount ?? 0) === 0).length;
		const totalViolations = enabled.reduce((sum, p) => sum + (p.violationCount ?? 0), 0);

		return {
			score: Math.round((passing / enabled.length) * 100),
			passing,
			total: enabled.length,
			totalViolations,
		};
	},
});
