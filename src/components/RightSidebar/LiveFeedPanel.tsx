import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

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

const activityIcon: Record<string, string> = {
	status_update: "🔄",
	message: "💬",
	document_created: "📄",
	assignees_update: "👥",
	task_update: "✏️",
	commented: "💬",
};

export default function LiveFeedPanel() {
	const activities = useQuery(api.queries.listActivities, {});

	return (
		<div className="p-3 space-y-2">
			{activities?.map((activity) => (
				<div
					key={activity._id}
					className="flex items-start gap-2 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
				>
					<span className="text-sm mt-0.5">{activityIcon[activity.type] ?? "📌"}</span>
					<div className="flex-1 min-w-0">
						<p className="text-xs text-sidebar-foreground">
							<span className="font-medium">{activity.agentName}</span> {activity.message}
						</p>
						<span className="text-[10px] text-muted-foreground">
							{timeAgo(activity._creationTime)}
						</span>
					</div>
				</div>
			))}
			{(!activities || activities.length === 0) && (
				<p className="text-xs text-muted-foreground text-center py-8">No activity yet</p>
			)}
		</div>
	);
}
