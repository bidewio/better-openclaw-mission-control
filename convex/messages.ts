import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuthTenantId, requireTenant } from "./lib/tenant";

export const deleteMessage = mutation({
	args: { messageId: v.id("messages") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		requireTenant(await ctx.db.get(args.messageId), tenantId, "Message");
		await ctx.db.delete(args.messageId);
	},
});

export const send = mutation({
	args: {
		taskId: v.id("tasks"),
		agentId: v.id("agents"),
		content: v.string(),
		attachments: v.optional(v.array(v.id("documents"))),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const task = requireTenant(await ctx.db.get(args.taskId), tenantId, "Task");

		requireTenant(await ctx.db.get(args.agentId), tenantId, "Agent");

		for (const attachmentId of args.attachments || []) {
			requireTenant(await ctx.db.get(attachmentId), tenantId, "Document");
		}

		await ctx.db.insert("messages", {
			taskId: args.taskId,
			fromAgentId: args.agentId,
			content: args.content,
			attachments: args.attachments || [],
			tenantId,
			updatedAt: Date.now(),
		});

		await ctx.db.insert("activities", {
			type: "message",
			agentId: args.agentId,
			message: `commented on "${task.title}"`,
			targetId: args.taskId,
			tenantId,
		});
	},
});
