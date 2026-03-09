import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthTenantId, requireTenant } from "./lib/tenant";

export const listByTask = query({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		requireTenant(await ctx.db.get(args.taskId), tenantId, "Task");

		return await ctx.db
			.query("documents")
			.withIndex("by_tenant_task", (q) => q.eq("tenantId", tenantId).eq("taskId", args.taskId))
			.collect();
	},
});

export const listAll = query({
	args: {
		type: v.optional(v.string()),
		agentId: v.optional(v.id("agents")),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		let documents = await ctx.db
			.query("documents")
			.withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
			.collect();

		if (args.type) {
			documents = documents.filter((doc) => doc.type === args.type);
		}

		if (args.agentId) {
			requireTenant(await ctx.db.get(args.agentId), tenantId, "Agent");
			documents = documents.filter((doc) => doc.createdByAgentId === args.agentId);
		}

		documents.sort((a, b) => b._creationTime - a._creationTime);

		// Join with agent info
		const documentsWithAgent = await Promise.all(
			documents.map(async (doc) => {
				const agent = doc.createdByAgentId ? await ctx.db.get(doc.createdByAgentId) : null;
				if (agent) {
					requireTenant(agent, tenantId, "Agent");
				}
				return {
					...doc,
					agentName: agent?.name ?? null,
					agentAvatar: agent?.avatar ?? null,
				};
			}),
		);

		return documentsWithAgent;
	},
});

export const getWithContext = query({
	args: { documentId: v.id("documents") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		const document = await ctx.db.get(args.documentId);
		if (!document) return null;
		requireTenant(document, tenantId, "Document");

		const agent = document.createdByAgentId ? await ctx.db.get(document.createdByAgentId) : null;
		if (agent) {
			requireTenant(agent, tenantId, "Agent");
		}

		const task = document.taskId ? await ctx.db.get(document.taskId) : null;
		if (task) {
			requireTenant(task, tenantId, "Task");
		}

		const message = document.messageId ? await ctx.db.get(document.messageId) : null;
		if (message) {
			requireTenant(message, tenantId, "Message");
		}

		// Get all messages for conversation context (full thread)
		let conversationMessages: Array<{
			_id: string;
			content: string;
			agentName: string | null;
			agentAvatar: string | null;
			_creationTime: number;
		}> = [];

		const documentTaskId = document.taskId;
		if (documentTaskId) {
			const taskMessages = await ctx.db
				.query("messages")
				.withIndex("by_tenant_task", (q) => q.eq("tenantId", tenantId).eq("taskId", documentTaskId))
				.order("asc")
				.collect();

			conversationMessages = await Promise.all(
				taskMessages.map(async (msg) => {
					const msgAgent = await ctx.db.get(msg.fromAgentId);
					if (msgAgent) {
						requireTenant(msgAgent, tenantId, "Agent");
					}
					return {
						_id: msg._id,
						content: msg.content,
						agentName: msgAgent?.name ?? null,
						agentAvatar: msgAgent?.avatar ?? null,
						_creationTime: msg._creationTime,
					};
				}),
			);
		}

		return {
			...document,
			agentName: agent?.name ?? null,
			agentAvatar: agent?.avatar ?? null,
			agentRole: agent?.role ?? null,
			taskTitle: task?.title ?? null,
			taskStatus: task?.status ?? null,
			taskDescription: task?.description ?? null,
			originMessage: message?.content ?? null,
			conversationMessages,
		};
	},
});

export const deleteDocument = mutation({
	args: { documentId: v.id("documents") },
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		requireTenant(await ctx.db.get(args.documentId), tenantId, "Document");
		await ctx.db.delete(args.documentId);
	},
});

export const create = mutation({
	args: {
		title: v.string(),
		content: v.string(),
		type: v.string(),
		path: v.optional(v.string()),
		taskId: v.optional(v.id("tasks")),
		agentId: v.id("agents"),
		messageId: v.optional(v.id("messages")),
	},
	handler: async (ctx, args) => {
		const tenantId = await requireAuthTenantId(ctx);
		requireTenant(await ctx.db.get(args.agentId), tenantId, "Agent");

		if (args.taskId) {
			requireTenant(await ctx.db.get(args.taskId), tenantId, "Task");
		}

		if (args.messageId) {
			requireTenant(await ctx.db.get(args.messageId), tenantId, "Message");
		}

		const docId = await ctx.db.insert("documents", {
			title: args.title,
			content: args.content,
			type: args.type,
			path: args.path,
			taskId: args.taskId,
			createdByAgentId: args.agentId,
			messageId: args.messageId,
			tenantId,
			updatedAt: Date.now(),
		});

		let message = `created document "${args.title}"`;
		if (args.taskId) {
			const task = await ctx.db.get(args.taskId);
			if (task) {
				requireTenant(task, tenantId, "Task");
				message += ` for "${task.title}"`;
			}
		}

		await ctx.db.insert("activities", {
			type: "document_created",
			agentId: args.agentId,
			message: message,
			targetId: args.taskId,
			tenantId,
		});

		return docId;
	},
});
