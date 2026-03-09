import type { Id } from "../../convex/_generated/dataModel";
import TaskCard from "./TaskCard";

interface KanbanColumnProps {
	title: string;
	icon: string;
	status: string;
	tasks: Array<{
		_id: Id<"tasks">;
		title: string;
		description: string;
		status: string;
		tags: string[];
		borderColor?: string;
		assigneeIds: Id<"agents">[];
		lastMessageTime?: number | null;
	}>;
	agents: Array<{
		_id: Id<"agents">;
		name: string;
		avatar: string;
	}>;
	selectedTaskId: Id<"tasks"> | null;
	onSelectTask: (id: Id<"tasks">) => void;
}

export default function KanbanColumn({
	title,
	icon,
	tasks,
	agents,
	selectedTaskId,
	onSelectTask,
}: KanbanColumnProps) {
	return (
		<div className="flex flex-col min-w-[260px] max-w-[320px] flex-1">
			<div className="flex items-center gap-2 mb-3 px-1">
				<span>{icon}</span>
				<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					{title}
				</h3>
				<span className="text-xs text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
					{tasks.length}
				</span>
			</div>
			<div className="flex-1 space-y-2 overflow-y-auto pr-1">
				{tasks.map((task) => (
					<TaskCard
						key={task._id}
						task={task}
						agents={agents}
						isSelected={selectedTaskId === task._id}
						onClick={() => onSelectTask(task._id)}
					/>
				))}
				{tasks.length === 0 && (
					<p className="text-xs text-muted-foreground text-center py-6 opacity-50">No tasks</p>
				)}
			</div>
		</div>
	);
}
