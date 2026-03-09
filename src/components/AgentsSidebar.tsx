import { IconPlayerPlay, IconPlus, IconX } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AgentsSidebarProps {
	isOpen: boolean;
	onClose: () => void;
	onAddTask: (preselectedAgentId?: string) => void;
	onAddAgent: () => void;
	onSelectAgent: (agentId: string) => void;
}

const statusColor: Record<string, string> = {
	active: "bg-green-500",
	idle: "bg-gray-400",
	blocked: "bg-red-500",
};

const levelBadge: Record<string, { text: string; className: string }> = {
	LEAD: {
		text: "LEAD",
		className:
			"bg-[var(--status-lead)]/20 text-[var(--status-lead)] border-[var(--status-lead)]/30",
	},
	INT: {
		text: "INT",
		className: "bg-[var(--status-int)]/20 text-[var(--status-int)] border-[var(--status-int)]/30",
	},
	SPC: {
		text: "SPC",
		className: "bg-[var(--status-spc)]/20 text-[var(--status-spc)] border-[var(--status-spc)]/30",
	},
};

export default function AgentsSidebar({
	isOpen,
	onClose,
	onAddTask,
	onAddAgent,
	onSelectAgent,
}: AgentsSidebarProps) {
	const agents = useQuery(api.queries.listAgents, {});

	const sidebarClasses = [
		"flex flex-col glass-panel border-r border-sidebar-border/50 overflow-y-auto",
		"md:static md:translate-x-0 z-10",
		"sidebar-drawer sidebar-drawer--left",
		isOpen ? "is-open" : "",
	].join(" ");

	return (
		<aside className={sidebarClasses} style={{ gridArea: "left-sidebar" }}>
			<div className="flex items-center justify-between p-4 border-b border-sidebar-border">
				<h2 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
					Agents
				</h2>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => onAddAgent()}
						className="p-1.5 hover:bg-sidebar-accent rounded-md text-muted-foreground hover:text-sidebar-foreground transition-colors"
						aria-label="Add agent"
					>
						<IconPlus size={16} />
					</button>
					<button
						type="button"
						onClick={onClose}
						className="md:hidden p-1.5 hover:bg-sidebar-accent rounded-md text-muted-foreground"
						aria-label="Close sidebar"
					>
						<IconX size={16} />
					</button>
				</div>
			</div>

			<div className="flex-1 p-3 space-y-1.5">
				{agents?.map((agent) => {
					const badge = levelBadge[agent.level];
					return (
						<div
							key={agent._id}
							className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-sidebar-accent"
						>
							<button
								type="button"
								onClick={() => onSelectAgent(agent._id)}
								className="flex flex-1 items-center gap-3 text-left"
							>
								<div className="relative">
									<span className="text-2xl">{agent.avatar}</span>
									<span
										className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar ${statusColor[agent.status] ?? "bg-gray-400"}`}
									/>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-sidebar-foreground truncate">
											{agent.name}
										</span>
										{badge && (
											<span
												className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${badge.className}`}
											>
												{badge.text}
											</span>
										)}
									</div>
									<p className="text-xs text-muted-foreground truncate">{agent.role}</p>
								</div>
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onAddTask(agent._id);
								}}
								className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-sidebar-foreground transition-all"
								aria-label={`Assign task to ${agent.name}`}
							>
								<IconPlayerPlay size={14} />
							</button>
						</div>
					);
				})}

				{agents?.length === 0 && (
					<p className="text-sm text-muted-foreground text-center py-8">No agents yet</p>
				)}
			</div>
		</aside>
	);
}
