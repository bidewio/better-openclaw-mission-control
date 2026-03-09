import { IconX } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface DocumentPreviewTrayProps {
	documentId: Id<"documents">;
	isOpen: boolean;
	onClose: () => void;
}

export default function DocumentPreviewTray({
	documentId,
	isOpen,
	onClose,
}: DocumentPreviewTrayProps) {
	const docContext = useQuery(api.documents.getWithContext, {
		documentId,
	});

	if (!docContext) return null;

	const isCode = docContext.type === "code";
	const isImage = docContext.type === "image";

	return (
		<div className={`tray tray-preview ${isOpen ? "is-open" : ""}`}>
			<div className="h-full flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-border">
					<div className="flex-1 min-w-0">
						<h3 className="text-sm font-semibold text-foreground truncate">{docContext.title}</h3>
						{docContext.path && (
							<p className="text-xs text-muted-foreground truncate font-mono">{docContext.path}</p>
						)}
					</div>
					<button
						aria-label="Close tray"
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-accent rounded-md text-muted-foreground"
					>
						<IconX size={16} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4">
					{isImage && docContext.path ? (
						<img
							src={`/api/local-file?path=${encodeURIComponent(docContext.path)}`}
							alt={docContext.title}
							className="max-w-full h-auto rounded-lg"
						/>
					) : isCode ? (
						<pre className="text-xs font-mono bg-secondary rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed text-foreground">
							{docContext.content}
						</pre>
					) : (
						<div className="prose prose-sm max-w-none text-foreground">
							<div className="text-sm whitespace-pre-wrap leading-relaxed">
								{docContext.content}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-3 border-t border-border text-xs text-muted-foreground flex items-center gap-3">
					<span className="capitalize bg-secondary px-2 py-0.5 rounded">{docContext.type}</span>
					{docContext.taskTitle && <span className="truncate">Task: {docContext.taskTitle}</span>}
				</div>
			</div>
		</div>
	);
}
