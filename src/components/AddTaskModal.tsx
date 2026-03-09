import { IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AddTaskModalProps {
	onClose: () => void;
	onCreated: (taskId: Id<"tasks">) => void;
	initialAssigneeId?: string;
}

const TAG_PRESETS = ["openclaw", "bug", "feature", "infra", "docs", "ui", "api", "security"];

const BORDER_COLORS = [
	"#3b82f6",
	"#10b981",
	"#f97316",
	"#a855f7",
	"#ef4444",
	"#eab308",
	"#ec4899",
	"#06b6d4",
];

export default function AddTaskModal({ onClose, onCreated, initialAssigneeId }: AddTaskModalProps) {
	const createTask = useMutation(api.tasks.createTask);
	const updateAssignees = useMutation(api.tasks.updateAssignees);
	const agents = useQuery(api.queries.listAgents, {});

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [borderColor, setBorderColor] = useState<string | undefined>();
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		setLoading(true);
		try {
			const taskId = await createTask({
				title: title.trim(),
				description: description.trim(),
				status: initialAssigneeId ? "assigned" : "inbox",
				tags,
				borderColor,
			});

			if (initialAssigneeId && agents) {
				const agent = agents.find((a: { _id: string }) => a._id === initialAssigneeId);
				if (agent) {
					await updateAssignees({
						taskId,
						assigneeIds: [agent._id],
						agentId: agent._id,
					});
				}
			}

			onCreated(taskId);
		} catch (err) {
			console.error("Failed to create task:", err);
		} finally {
			setLoading(false);
		}
	};

	const toggleTag = (tag: string) => {
		setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
	};

	return (
		<div className="fixed inset-0 z-200 flex items-center justify-center">
			<button
				aria-label="Close modal backdrop"
				type="button"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>
			<form
				onSubmit={handleSubmit}
				className="relative z-10 bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4"
			>
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-card-foreground">New Task</h3>
					<button
						aria-label="Close modal"
						type="button"
						onClick={onClose}
						className="p-1 hover:bg-accent rounded-md text-muted-foreground"
					>
						<IconX size={18} />
					</button>
				</div>

				<div>
					<label htmlFor="task-title" className="mb-1 block text-sm text-muted-foreground">
						Title
					</label>
					<input
						id="task-title"
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full px-3 py-2 bg-input rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
						placeholder="What needs to be done?"
						required
					/>
				</div>

				<div>
					<label htmlFor="task-description" className="mb-1 block text-sm text-muted-foreground">
						Description
					</label>
					<textarea
						id="task-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full px-3 py-2 bg-input rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
						rows={3}
						placeholder="Describe the task..."
					/>
				</div>

				<div>
					<p className="mb-1 block text-sm text-muted-foreground">Tags</p>
					<div className="flex flex-wrap gap-1.5">
						{TAG_PRESETS.map((tag) => (
							<button
								key={tag}
								type="button"
								onClick={() => toggleTag(tag)}
								className={[
									"text-xs px-2 py-1 rounded-full border transition-colors",
									tags.includes(tag)
										? "bg-primary text-primary-foreground border-primary"
										: "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground",
								].join(" ")}
							>
								{tag}
							</button>
						))}
					</div>
				</div>

				<div>
					<p className="mb-1 block text-sm text-muted-foreground">Color</p>
					<div className="flex gap-2">
						{BORDER_COLORS.map((color) => (
							<button
								aria-label="Select color"
								key={color}
								type="button"
								onClick={() => setBorderColor(borderColor === color ? undefined : color)}
								className={[
									"w-6 h-6 rounded-full transition-transform",
									borderColor === color
										? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110"
										: "",
								].join(" ")}
								style={{ backgroundColor: color }}
							/>
						))}
					</div>
				</div>

				<div className="flex gap-2 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading || !title.trim()}
						className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
					>
						{loading ? "Creating..." : "Create Task"}
					</button>
				</div>
			</form>
		</div>
	);
}
