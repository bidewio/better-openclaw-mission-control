import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuthTenantId, requireTenant } from "./lib/tenant";

export const updateStatus = mutation({
	args: {
		taskId: v.id("tasks"),
		status: v.union(
			v.literal("inbox"),
			v.literal("assigned"),
			v.literal("in_progress"),
			v.literal("review"),
			v.literal("done"),
			v.literal("archived"),
		),
		agentId: v.id("agents"),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const task = requireTenant(await ctx.db.get(args.taskId), tenantId, "Task");

		requireTenant(await ctx.db.get(args.agentId), tenantId, "Agent");

		await ctx.db.patch(args.taskId, { status: args.status, updatedAt: Date.now() });

		await ctx.db.insert("activities", {
			type: "status_update",
			agentId: args.agentId,
			message: `changed status of "${task.title}" to ${args.status}`,
			targetId: args.taskId,
			tenantId,
		});
	},
});

export const updateAssignees = mutation({
	args: {
		taskId: v.id("tasks"),
		assigneeIds: v.array(v.id("agents")),
		agentId: v.id("agents"),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const task = requireTenant(await ctx.db.get(args.taskId), tenantId, "Task");

		requireTenant(await ctx.db.get(args.agentId), tenantId, "Agent");

		for (const assigneeId of args.assigneeIds) {
			requireTenant(await ctx.db.get(assigneeId), tenantId, "Assignee");
		}

		await ctx.db.patch(args.taskId, { assigneeIds: args.assigneeIds, updatedAt: Date.now() });

		await ctx.db.insert("activities", {
			type: "assignees_update",
			agentId: args.agentId,
			message: `updated assignees for "${task.title}"`,
			targetId: args.taskId,
			tenantId,
		});
	},
});

export const createTask = mutation({
	args: {
		title: v.string(),
		description: v.string(),
		status: v.string(),
		tags: v.array(v.string()),
		borderColor: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const taskId = await ctx.db.insert("tasks", {
			title: args.title,
			description: args.description,
			// biome-ignore lint: status union validated externally
			status: args.status as any,
			assigneeIds: [],
			tags: args.tags,
			borderColor: args.borderColor,
			tenantId,
			updatedAt: Date.now(),
		});
		return taskId;
	},
});

export const archiveTask = mutation({
	args: {
		taskId: v.id("tasks"),
		agentId: v.id("agents"),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const task = requireTenant(await ctx.db.get(args.taskId), tenantId, "Task");

		requireTenant(await ctx.db.get(args.agentId), tenantId, "Agent");

		await ctx.db.patch(args.taskId, { status: "archived", updatedAt: Date.now() });

		await ctx.db.insert("activities", {
			type: "status_update",
			agentId: args.agentId,
			message: `archived "${task.title}"`,
			targetId: args.taskId,
			tenantId,
		});
	},
});

export const linkRun = mutation({
	args: {
		taskId: v.id("tasks"),
		openclawRunId: v.string(),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		requireTenant(await ctx.db.get(args.taskId), tenantId, "Task");

		await ctx.db.patch(args.taskId, {
			openclawRunId: args.openclawRunId,
			startedAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

export const deleteTask = mutation({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		requireTenant(await ctx.db.get(args.taskId), tenantId, "Task");
		await ctx.db.delete(args.taskId);
	},
});

export const updateTask = mutation({
	args: {
		taskId: v.id("tasks"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		agentId: v.id("agents"),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const task = requireTenant(await ctx.db.get(args.taskId), tenantId, "Task");

		requireTenant(await ctx.db.get(args.agentId), tenantId, "Agent");

		// biome-ignore lint: dynamic field updates
		const fields: any = {};
		const updates: string[] = [];

		if (args.title !== undefined) {
			fields.title = args.title;
			updates.push("title");
		}
		if (args.description !== undefined) {
			fields.description = args.description;
			updates.push("description");
		}
		if (args.tags !== undefined) {
			fields.tags = args.tags;
			updates.push("tags");
		}

		fields.updatedAt = Date.now();
		await ctx.db.patch(args.taskId, fields);

		if (updates.length > 0) {
			await ctx.db.insert("activities", {
				type: "task_update",
				agentId: args.agentId,
				message: `updated ${updates.join(", ")} of "${task.title}"`,
				targetId: args.taskId,
				tenantId,
			});
		}
	},
});
