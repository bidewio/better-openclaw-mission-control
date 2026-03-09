import { IconEye, IconX } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface ConversationTrayProps {
	documentId: Id<"documents">;
	isOpen: boolean;
	onClose: () => void;
	onOpenPreview: () => void;
	showPreview: boolean;
}

export default function ConversationTray({
	documentId,
	isOpen,
	onClose,
	onOpenPreview,
	showPreview,
}: ConversationTrayProps) {
	const docContext = useQuery(api.documents.getWithContext, {
		documentId,
	});

	if (!docContext) return null;

	return (
		<div className={`tray ${isOpen ? "is-open" : ""}`}>
			<div className="h-full flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-border">
					<div className="flex-1 min-w-0">
						<h3 className="text-sm font-semibold text-foreground truncate">
							{docContext.taskTitle ?? docContext.title}
						</h3>
						{docContext.taskTitle && (
							<p className="text-xs text-muted-foreground truncate">{docContext.title}</p>
						)}
					</div>
					<div className="flex items-center gap-1">
						{!showPreview && (
							<button
								type="button"
								onClick={onOpenPreview}
								className="p-1.5 hover:bg-accent rounded-md text-muted-foreground"
								title="Show preview"
							>
								<IconEye size={16} />
							</button>
						)}
						<button
							aria-label="Close tray"
							type="button"
							onClick={onClose}
							className="p-1.5 hover:bg-accent rounded-md text-muted-foreground"
						>
							<IconX size={16} />
						</button>
					</div>
				</div>

				{/* Conversation Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{docContext.conversationMessages.map((msg) => (
						<div key={msg._id} className="flex gap-2 items-start">
							<span className="text-lg shrink-0">{msg.agentAvatar ?? "🤖"}</span>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-0.5">
									<span className="text-xs font-medium text-foreground">
										{msg.agentName ?? "Agent"}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{new Date(msg._creationTime).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
								<div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
									{msg.content}
								</div>
							</div>
						</div>
					))}
					{docContext.conversationMessages.length === 0 && (
						<p className="text-xs text-muted-foreground text-center py-8">
							No conversation for this document
						</p>
					)}
				</div>

				{/* Document Info */}
				<div className="p-3 border-t border-border bg-secondary/30">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						{docContext.agentAvatar && <span>{docContext.agentAvatar}</span>}
						<span>Created by {docContext.agentName ?? "Unknown"}</span>
						{docContext.path && (
							<span className="truncate ml-auto text-[10px]">{docContext.path}</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
