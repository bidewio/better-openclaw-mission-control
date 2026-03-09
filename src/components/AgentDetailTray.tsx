import { IconX } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AgentDetailTrayProps {
	agentId: Id<"agents"> | null;
	onClose: () => void;
}

export default function AgentDetailTray({ agentId, onClose }: AgentDetailTrayProps) {
	const agents = useQuery(api.queries.listAgents, {});
	const tasks = useQuery(api.queries.listTasks, {});
	const activities = useQuery(api.queries.listActivities, {
		agentId: agentId ?? undefined,
	});

	const agent = agents?.find((a) => a._id === agentId);
	const agentTasks = tasks?.filter((t) => (agent ? t.assigneeIds.includes(agent._id) : false));

	return (
		<div className={`agent-tray ${agentId ? "is-open" : ""}`}>
			{agent && (
				<div className="h-full flex flex-col overflow-y-auto">
					{/* Agent Header */}
					<div className="p-6 border-b border-border">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-3">
								<span className="text-4xl">{agent.avatar}</span>
								<div>
									<h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
									<p className="text-sm text-muted-foreground">{agent.role}</p>
								</div>
							</div>
							<button
								aria-label="Close tray"
								type="button"
								onClick={onClose}
								className="p-1.5 hover:bg-accent rounded-md text-muted-foreground"
							>
								<IconX size={18} />
							</button>
						</div>
						<div className="flex items-center gap-2 mt-3">
							<span
								className={`text-xs px-2 py-0.5 rounded-full font-medium ${
									agent.status === "active"
										? "bg-green-500/20 text-green-500"
										: agent.status === "blocked"
											? "bg-red-500/20 text-red-500"
											: "bg-gray-400/20 text-gray-400"
								}`}
							>
								{agent.status}
							</span>
							<span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
								{agent.level}
							</span>
						</div>
					</div>

					{/* Tasks */}
					<div className="p-4 border-b border-border">
						<h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
							Tasks ({agentTasks?.length ?? 0})
						</h4>
						<div className="space-y-1.5">
							{agentTasks?.map((task) => (
								<div
									key={task._id}
									className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
								>
									<span className="text-xs">
										{task.status === "done"
											? "✅"
											: task.status === "in_progress"
												? "⚡"
												: task.status === "review"
													? "🔍"
													: "📋"}
									</span>
									<span className="text-sm text-foreground truncate">{task.title}</span>
								</div>
							))}
							{agentTasks?.length === 0 && (
								<p className="text-xs text-muted-foreground py-2">No tasks assigned</p>
							)}
						</div>
					</div>

					{/* Recent Activity */}
					<div className="p-4 flex-1">
						<h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
							Recent Activity
						</h4>
						<div className="space-y-2">
							{activities?.slice(0, 10).map((activity) => (
								<div key={activity._id} className="text-xs text-muted-foreground">
									<span className="text-foreground font-medium">{activity.agentName}</span>{" "}
									{activity.message}
								</div>
							))}
							{(!activities || activities.length === 0) && (
								<p className="text-xs text-muted-foreground py-2">No recent activity</p>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
