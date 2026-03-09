import { IconX } from "@tabler/icons-react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import DocumentsPanel from "./DocumentsPanel";
import LiveFeedPanel from "./LiveFeedPanel";

interface RightSidebarProps {
	isOpen: boolean;
	onClose: () => void;
	selectedDocumentId: Id<"documents"> | null;
	onSelectDocument: (id: Id<"documents"> | null) => void;
	onPreviewDocument: (id: Id<"documents">) => void;
}

type TabId = "documents" | "feed";

export default function RightSidebar({
	isOpen,
	onClose,
	selectedDocumentId,
	onSelectDocument,
	onPreviewDocument,
}: RightSidebarProps) {
	const [activeTab, setActiveTab] = useState<TabId>("feed");

	const sidebarClasses = [
		"flex flex-col bg-sidebar border-l border-sidebar-border overflow-hidden",
		"md:static md:translate-x-0",
		"sidebar-drawer sidebar-drawer--right",
		isOpen ? "is-open" : "",
	].join(" ");

	return (
		<aside className={sidebarClasses} style={{ gridArea: "right-sidebar" }}>
			{/* Tab Header */}
			<div className="flex items-center border-b border-sidebar-border">
				<button
					type="button"
					className={[
						"flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
						activeTab === "feed"
							? "text-sidebar-foreground border-b-2 border-primary"
							: "text-muted-foreground hover:text-sidebar-foreground",
					].join(" ")}
					onClick={() => setActiveTab("feed")}
				>
					Live Feed
				</button>
				<button
					type="button"
					className={[
						"flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
						activeTab === "documents"
							? "text-sidebar-foreground border-b-2 border-primary"
							: "text-muted-foreground hover:text-sidebar-foreground",
					].join(" ")}
					onClick={() => setActiveTab("documents")}
				>
					Documents
				</button>
				<button
					type="button"
					className="md:hidden p-2 hover:bg-sidebar-accent rounded-md text-muted-foreground mx-1"
					onClick={onClose}
					aria-label="Close sidebar"
				>
					<IconX size={16} />
				</button>
			</div>

			{/* Tab Content */}
			<div className="flex-1 overflow-y-auto">
				{activeTab === "feed" && <LiveFeedPanel />}
				{activeTab === "documents" && (
					<DocumentsPanel
						selectedDocumentId={selectedDocumentId}
						onSelectDocument={onSelectDocument}
						onPreviewDocument={onPreviewDocument}
					/>
				)}
			</div>
		</aside>
	);
}
