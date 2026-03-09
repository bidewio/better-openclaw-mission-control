import { IconCode, IconFile, IconFileText, IconPhoto } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface DocumentsPanelProps {
	selectedDocumentId: Id<"documents"> | null;
	onSelectDocument: (id: Id<"documents"> | null) => void;
	onPreviewDocument: (id: Id<"documents">) => void;
}

const typeIcon: Record<string, React.ReactNode> = {
	code: <IconCode size={14} />,
	document: <IconFileText size={14} />,
	image: <IconPhoto size={14} />,
};

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

export default function DocumentsPanel({
	selectedDocumentId,
	onSelectDocument: _onSelectDocument,
	onPreviewDocument,
}: DocumentsPanelProps) {
	const documents = useQuery(api.documents.listAll, {});

	return (
		<div className="p-3 space-y-1.5">
			{documents?.map((doc) => (
				<button
					key={doc._id}
					type="button"
					onClick={() => onPreviewDocument(doc._id)}
					className={[
						"w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors",
						selectedDocumentId === doc._id
							? "bg-sidebar-accent ring-1 ring-primary/30"
							: "hover:bg-sidebar-accent/50",
					].join(" ")}
				>
					<span className="mt-0.5 text-muted-foreground">
						{typeIcon[doc.type] ?? <IconFile size={14} />}
					</span>
					<div className="flex-1 min-w-0">
						<p className="text-xs font-medium text-sidebar-foreground truncate">{doc.title}</p>
						{doc.path && <p className="text-[10px] text-muted-foreground truncate">{doc.path}</p>}
						<div className="flex items-center gap-2 mt-0.5">
							{doc.agentName && (
								<span className="text-[10px] text-muted-foreground">
									{doc.agentAvatar} {doc.agentName}
								</span>
							)}
							<span className="text-[10px] text-muted-foreground">
								{timeAgo(doc._creationTime)}
							</span>
						</div>
					</div>
				</button>
			))}
			{(!documents || documents.length === 0) && (
				<p className="text-xs text-muted-foreground text-center py-8">No documents yet</p>
			)}
		</div>
	);
}
