import type { Id } from "../../../convex/_generated/dataModel";
import ConversationTray from "./ConversationTray";
import DocumentPreviewTray from "./DocumentPreviewTray";

interface TrayContainerProps {
	selectedDocumentId: Id<"documents"> | null;
	showConversation: boolean;
	showPreview: boolean;
	onCloseConversation: () => void;
	onClosePreview: () => void;
	onOpenPreview: () => void;
}

export default function TrayContainer({
	selectedDocumentId,
	showConversation,
	showPreview,
	onCloseConversation,
	onClosePreview,
	onOpenPreview,
}: TrayContainerProps) {
	if (!selectedDocumentId) return null;

	return (
		<div className="tray-container">
			{(showConversation || showPreview) && (
				<div className="tray-backdrop" onClick={onCloseConversation} aria-hidden="true" />
			)}
			<ConversationTray
				documentId={selectedDocumentId}
				isOpen={showConversation}
				onClose={onCloseConversation}
				onOpenPreview={onOpenPreview}
				showPreview={showPreview}
			/>
			<DocumentPreviewTray
				documentId={selectedDocumentId}
				isOpen={showPreview}
				onClose={onClosePreview}
			/>
		</div>
	);
}
