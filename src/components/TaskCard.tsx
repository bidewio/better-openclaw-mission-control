import type { Id } from "../../convex/_generated/dataModel";

interface TaskCardProps {
	task: {
		_id: Id<"tasks">;
		title: string;
		description: string;
		status: string;
		tags: string[];
		borderColor?: string;
		assigneeIds: Id<"agents">[];
		lastMessageTime?: number | null;
	};
	agents: Array<{
		_id: Id<"agents">;
		name: string;
		avatar: string;
	}>;
	isSelected: boolean;
	onClick: () => void;
}

function timeAgo(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export default function TaskCard({ task, agents, isSelected, onClick }: TaskCardProps) {
	const assignedAgents = agents.filter((a) => task.assigneeIds.includes(a._id));

	const isRunning = task.status === "in_progress";

	return (
		<button
			type="button"
			onClick={onClick}
			className={[
				"w-full p-3 rounded-lg border cursor-pointer text-left transition-all",
				"bg-card hover:shadow-md",
				isSelected
					? "ring-2 ring-primary border-primary"
					: "border-border hover:border-muted-foreground/30",
				isRunning ? "card-running" : "",
			].join(" ")}
			style={{
				borderLeftWidth: task.borderColor ? "3px" : undefined,
				borderLeftColor: task.borderColor || undefined,
			}}
		>
			<h4 className="text-sm font-medium text-card-foreground mb-1 line-clamp-2">{task.title}</h4>

			<p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>

			{task.tags.length > 0 && (
				<div className="flex flex-wrap gap-1 mb-2">
					{task.tags.map((tag) => (
						<span
							key={tag}
							className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground"
						>
							{tag}
						</span>
					))}
				</div>
			)}

			<div className="flex items-center justify-between">
				<div className="flex items-center -space-x-1">
					{assignedAgents.map((agent) => (
						<span key={agent._id} className="text-sm" title={agent.name}>
							{agent.avatar}
						</span>
					))}
					{assignedAgents.length === 0 && (
						<span className="text-xs text-muted-foreground">Unassigned</span>
					)}
				</div>
				{task.lastMessageTime && (
					<span className="text-[10px] text-muted-foreground">{timeAgo(task.lastMessageTime)}</span>
				)}
			</div>
		</button>
	);
}
