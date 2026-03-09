import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthTenantId, requireTenant } from "./lib/tenant";

/** Overview counts: total / online / degraded / offline. */
export const getFleetOverview = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await requireAuthTenantId(ctx);
		const instances = await ctx.db
			.query("fleetInstances")
			.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
			.collect();

		const counts = { total: instances.length, online: 0, degraded: 0, offline: 0, provisioning: 0 };
		for (const inst of instances) {
			if (inst.status === "online") counts.online++;
			else if (inst.status === "degraded") counts.degraded++;
			else if (inst.status === "provisioning") counts.provisioning++;
			else counts.offline++;
		}
		return counts;
	},
});

/** List all fleet instances with stack join. */
export const listFleetInstances = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await requireAuthTenantId(ctx);
		const instances = await ctx.db
			.query("fleetInstances")
			.withIndex("by_tenant", (idx) => idx.eq("tenantId", tenantId))
			.collect();

		return Promise.all(
			instances.map(async (inst) => {
				const stack = await ctx.db.get(inst.stackId);
				return {
					...inst,
					stackName: stack?.projectName ?? "Unknown Stack",
				};
			}),
		);
	},
});

/** Get single fleet instance. */
export const getFleetInstance = query({
	args: { id: v.id("fleetInstances") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const inst = await ctx.db.get(args.id);
		return requireTenant(inst, tenantId, "FleetInstance");
	},
});

/** Register a new fleet instance. */
export const registerFleetInstance = mutation({
	args: {
		stackId: v.id("stacks"),
		label: v.string(),
		host: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		return ctx.db.insert("fleetInstances", {
			stackId: args.stackId,
			label: args.label,
			host: args.host,
			status: "provisioning",
			lastHeartbeat: Date.now(),
			tenantId,
		});
	},
});

/** Update instance status (called by heartbeat / agent). */
export const updateInstanceStatus = mutation({
	args: {
		id: v.id("fleetInstances"),
		status: v.string(),
		serviceStatuses: v.optional(v.string()),
		configHash: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const patch: Record<string, unknown> = {
			status: args.status,
			lastHeartbeat: Date.now(),
		};
		if (args.serviceStatuses !== undefined) patch.serviceStatuses = args.serviceStatuses;
		if (args.configHash !== undefined) patch.configHash = args.configHash;

		await ctx.db.patch(args.id, patch);
	},
});

/** Remove a fleet instance. */
export const removeFleetInstance = mutation({
	args: { id: v.id("fleetInstances") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

/** Bulk update status for multiple instances. */
export const bulkUpdateStatus = mutation({
	args: {
		ids: v.array(v.id("fleetInstances")),
		status: v.string(),
	},
	handler: async (ctx, args) => {
		for (const id of args.ids) {
			await ctx.db.patch(id, { status: args.status, lastHeartbeat: Date.now() });
		}
	},
});

/** Bulk remove instances. */
export const bulkRemove = mutation({
	args: { ids: v.array(v.id("fleetInstances")) },
	handler: async (ctx, args) => {
		for (const id of args.ids) {
			await ctx.db.delete(id);
		}
	},
});
