import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import KanbanColumn from "./KanbanColumn";

interface MissionQueueProps {
	selectedTaskId: Id<"tasks"> | null;
	onSelectTask: (id: Id<"tasks">) => void;
}

const COLUMNS = [
	{ key: "inbox", title: "Inbox", icon: "📥" },
	{ key: "assigned", title: "Assigned", icon: "📋" },
	{ key: "in_progress", title: "In Progress", icon: "⚡" },
	{ key: "review", title: "Review", icon: "🔍" },
	{ key: "done", title: "Done", icon: "✅" },
];

export default function MissionQueue({ selectedTaskId, onSelectTask }: MissionQueueProps) {
	const tasks = useQuery(api.queries.listTasks, {});
	const agents = useQuery(api.queries.listAgents, {});

	const tasksByStatus = (status: string) => (tasks ?? []).filter((t) => t.status === status);

	return (
		<section className="flex-1 overflow-hidden p-4" style={{ gridArea: "main" }}>
			<div className="flex gap-4 h-full overflow-x-auto">
				{COLUMNS.map((col) => (
					<KanbanColumn
						key={col.key}
						title={col.title}
						icon={col.icon}
						status={col.key}
						tasks={tasksByStatus(col.key)}
						agents={agents ?? []}
						selectedTaskId={selectedTaskId}
						onSelectTask={onSelectTask}
					/>
				))}
			</div>
		</section>
	);
}
