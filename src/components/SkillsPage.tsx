/**
 * SkillsPage — view and edit skill markdown files for the selected stack.
 * Shows a list of skills with a split editor/preview panel.
 */

import { IconCheck, IconDeviceFloppy, IconPencil, IconRotate, IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import StackSelector from "./StackSelector";

interface SkillsPageProps {
	onRegisterStack: () => void;
}

export default function SkillsPage({ onRegisterStack }: SkillsPageProps) {
	const [selectedStackId, setSelectedStackId] = useState<Id<"stacks"> | null>(null);
	const [editingSkill, setEditingSkill] = useState<Doc<"stackSkills"> | null>(null);

	const skills = useQuery(
		api.stacks.listStackSkills,
		selectedStackId ? { stackId: selectedStackId } : "skip",
	);

	return (
		<div className="flex-1 overflow-y-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-foreground">Skills</h2>
			</div>

			<StackSelector
				selectedStackId={selectedStackId}
				onSelect={setSelectedStackId}
				onRegister={onRegisterStack}
			/>

			{selectedStackId &&
				skills &&
				(skills.length > 0 ? (
					<div className="space-y-3">
						{skills.map((skill) => (
							<SkillCard key={skill._id} skill={skill} onEdit={() => setEditingSkill(skill)} />
						))}
					</div>
				) : (
					<p className="text-sm text-muted-foreground text-center py-12">
						No skills found in this stack.
					</p>
				))}

			{!selectedStackId && (
				<p className="text-sm text-muted-foreground text-center py-12">
					Select a stack above to view its skills.
				</p>
			)}

			{editingSkill && (
				<SkillEditorModal skill={editingSkill} onClose={() => setEditingSkill(null)} />
			)}
		</div>
	);
}

function SkillCard({ skill, onEdit }: { skill: Doc<"stackSkills">; onEdit: () => void }) {
	return (
		<div className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 hover:border-primary/50 transition-colors group">
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<span className="text-sm font-medium text-foreground">{skill.name}</span>
					<span className="text-[10px] text-muted-foreground font-mono">{skill.path}</span>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					{skill.serviceIds.map((id) => (
						<span
							key={id}
							className="px-2 py-0.5 rounded bg-secondary text-[10px] font-medium text-muted-foreground"
						>
							{id}
						</span>
					))}
				</div>
				{skill.content && (
					<p className="text-xs text-muted-foreground mt-2 line-clamp-2">
						{skill.content.slice(0, 200)}
					</p>
				)}
			</div>
			<button
				type="button"
				onClick={onEdit}
				className="shrink-0 flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
			>
				<IconPencil size={14} />
				Edit
			</button>
		</div>
	);
}

function SkillEditorModal({ skill, onClose }: { skill: Doc<"stackSkills">; onClose: () => void }) {
	const updateContent = useMutation(api.stacks.updateSkillContent);
	const [content, setContent] = useState(skill.content);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [showPreview, setShowPreview] = useState(true);
	const hasChanges = content !== skill.content;

	// Reset saved indicator after 2s
	useEffect(() => {
		if (!saved) return;
		const t = setTimeout(() => setSaved(false), 2000);
		return () => clearTimeout(t);
	}, [saved]);

	const handleSave = useCallback(async () => {
		setSaving(true);
		try {
			await updateContent({ skillId: skill._id, content });
			setSaved(true);
		} finally {
			setSaving(false);
		}
	}, [updateContent, skill._id, content]);

	const handleRevert = useCallback(() => {
		setContent(skill.content);
	}, [skill.content]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-4xl h-[80vh] rounded-xl border border-border bg-background shadow-2xl flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-semibold text-foreground">{skill.name}</h2>
						<span className="text-xs text-muted-foreground font-mono">{skill.path}</span>
						{hasChanges && (
							<span className="text-xs text-primary font-medium">unsaved changes</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setShowPreview(!showPreview)}
							className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
								showPreview
									? "bg-primary/20 text-primary"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Preview
						</button>
						<button
							type="button"
							onClick={handleRevert}
							disabled={!hasChanges}
							className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
							title="Revert changes"
						>
							<IconRotate size={16} />
						</button>
						<button
							type="button"
							onClick={handleSave}
							disabled={!hasChanges || saving}
							className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{saved ? (
								<>
									<IconCheck size={14} /> Saved
								</>
							) : (
								<>
									<IconDeviceFloppy size={14} /> {saving ? "Saving..." : "Save"}
								</>
							)}
						</button>
						<button
							title="Close"
							type="button"
							onClick={onClose}
							className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
						>
							<IconX size={16} />
						</button>
					</div>
				</div>

				{/* Editor + Preview */}
				<div
					className={`flex-1 flex overflow-hidden ${showPreview ? "divide-x divide-border" : ""}`}
				>
					{/* Editor */}
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className={`${showPreview ? "w-1/2" : "w-full"} h-full bg-secondary/30 p-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none`}
						placeholder="# Skill Markdown content..."
						spellCheck={false}
					/>

					{/* Preview */}
					{showPreview && (
						<div className="w-1/2 h-full overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
							<Markdown>{content}</Markdown>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
