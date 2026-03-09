/**
 * Stack management — Convex mutations and queries for registered stacks,
 * their services, and their skills.
 *
 * A "stack" is registered by POSTing a stack-manifest.json (produced by
 * the core generator) to the /stack/register HTTP endpoint.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthTenantId, requireTenant } from "./lib/tenant";

const DEFAULT_TENANT_ID = "default";

// ── Queries ─────────────────────────────────────────────────────────────────

export const listStacks = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await requireAuthTenantId(ctx);
		return await ctx.db
			.query("stacks")
			.withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
			.order("desc")
			.collect();
	},
});

export const getStack = query({
	args: { stackId: v.id("stacks") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		return requireTenant(await ctx.db.get(args.stackId), tenantId, "Stack");
	},
});

export const listStackServices = query({
	args: { stackId: v.id("stacks") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const stack = await ctx.db.get(args.stackId);
		requireTenant(stack, tenantId, "Stack");
		return await ctx.db
			.query("stackServices")
			.withIndex("by_stack", (q) => q.eq("stackId", args.stackId))
			.collect();
	},
});

export const listStackSkills = query({
	args: { stackId: v.id("stacks") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const stack = await ctx.db.get(args.stackId);
		requireTenant(stack, tenantId, "Stack");
		return await ctx.db
			.query("stackSkills")
			.withIndex("by_stack", (q) => q.eq("stackId", args.stackId))
			.collect();
	},
});

export const getStackSkill = query({
	args: { skillId: v.id("stackSkills") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		return requireTenant(await ctx.db.get(args.skillId), tenantId, "Skill");
	},
});

// ── Mutations ───────────────────────────────────────────────────────────────

/** Register a stack from a parsed stack-manifest.json. */
export const registerStack = mutation({
	args: {
		projectName: v.string(),
		domain: v.optional(v.string()),
		deployment: v.optional(v.string()),
		deploymentType: v.optional(v.string()),
		platform: v.optional(v.string()),
		proxy: v.optional(v.string()),
		manifestVersion: v.string(),
		services: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				category: v.string(),
				icon: v.string(),
				image: v.string(),
				imageTag: v.string(),
				ports: v.array(
					v.object({
						container: v.number(),
						host: v.optional(v.number()),
						exposed: v.boolean(),
						description: v.string(),
					}),
				),
				docsUrl: v.optional(v.string()),
				addedBy: v.string(),
				dependencyOf: v.optional(v.string()),
			}),
		),
		skills: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				path: v.string(),
				content: v.optional(v.string()),
				serviceIds: v.array(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		let tenantId: string;
		try {
			tenantId = await requireAuthTenantId(ctx);
		} catch {
			tenantId = DEFAULT_TENANT_ID;
		}

		// Create the stack record
		const stackId = await ctx.db.insert("stacks", {
			projectName: args.projectName,
			domain: args.domain,
			deployment: args.deployment,
			deploymentType: args.deploymentType,
			platform: args.platform,
			proxy: args.proxy,
			manifestVersion: args.manifestVersion,
			registeredAt: Date.now(),
			tenantId,
		});

		// Insert services
		for (const svc of args.services) {
			await ctx.db.insert("stackServices", {
				stackId,
				serviceId: svc.id,
				name: svc.name,
				category: svc.category,
				icon: svc.icon,
				image: svc.image,
				imageTag: svc.imageTag,
				ports: svc.ports,
				docsUrl: svc.docsUrl,
				addedBy: svc.addedBy,
				dependencyOf: svc.dependencyOf,
				status: "unknown",
				tenantId,
			});
		}

		// Insert skills
		for (const skill of args.skills) {
			await ctx.db.insert("stackSkills", {
				stackId,
				skillId: skill.id,
				name: skill.name,
				path: skill.path,
				content: skill.content ?? "",
				serviceIds: skill.serviceIds,
				tenantId,
			});
		}

		return stackId;
	},
});

/** Update service status (running, stopped, error, unknown). */
export const updateServiceStatus = mutation({
	args: {
		serviceId: v.id("stackServices"),
		status: v.string(),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const svc = await ctx.db.get(args.serviceId);
		requireTenant(svc, tenantId, "Service");
		await ctx.db.patch(args.serviceId, { status: args.status });
	},
});

/** Update a skill's markdown content. */
export const updateSkillContent = mutation({
	args: {
		skillId: v.id("stackSkills"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const skill = await ctx.db.get(args.skillId);
		requireTenant(skill, tenantId, "Skill");
		await ctx.db.patch(args.skillId, { content: args.content });
	},
});

/** Update a service's environment variable overrides (stored as .env-format string). */
export const updateServiceEnv = mutation({
	args: {
		serviceId: v.id("stackServices"),
		envOverrides: v.string(),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const svc = await ctx.db.get(args.serviceId);
		requireTenant(svc, tenantId, "Service");
		await ctx.db.patch(args.serviceId, { envOverrides: args.envOverrides });
	},
});

/** Delete a stack and cascade to its services and skills. */
export const deleteStack = mutation({
	args: { stackId: v.id("stacks") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const stack = await ctx.db.get(args.stackId);
		requireTenant(stack, tenantId, "Stack");

		// Delete associated services
		const services = await ctx.db
			.query("stackServices")
			.withIndex("by_stack", (q) => q.eq("stackId", args.stackId))
			.collect();
		for (const svc of services) {
			await ctx.db.delete(svc._id);
		}

		// Delete associated skills
		const skills = await ctx.db
			.query("stackSkills")
			.withIndex("by_stack", (q) => q.eq("stackId", args.stackId))
			.collect();
		for (const skill of skills) {
			await ctx.db.delete(skill._id);
		}

		await ctx.db.delete(args.stackId);
	},
});
