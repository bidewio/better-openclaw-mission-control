import { IconX } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

interface AddAgentModalProps {
	onClose: () => void;
	onCreated: () => void;
}

const AVATARS = ["🤖", "🦊", "⚡", "👁️", "🌸", "🐉", "🦅", "🔮", "🎭", "🐺"];
const LEVELS = ["LEAD", "INT", "SPC"] as const;

export default function AddAgentModal({ onClose, onCreated }: AddAgentModalProps) {
	const createAgent = useMutation(api.agents.createAgent);

	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [level, setLevel] = useState<(typeof LEVELS)[number]>("INT");
	const [avatar, setAvatar] = useState("🤖");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setLoading(true);
		try {
			await createAgent({
				name: name.trim(),
				role: role.trim() || "Agent",
				level,
				avatar,
				status: "idle",
			});
			onCreated();
		} catch (err) {
			console.error("Failed to create agent:", err);
		} finally {
			setLoading(false);
		}
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
				className="relative z-10 bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
			>
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-card-foreground">New Agent</h3>
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
					<p className="mb-1 block text-sm text-muted-foreground">Avatar</p>
					<div className="flex flex-wrap gap-2">
						{AVATARS.map((a) => (
							<button
								key={a}
								type="button"
								onClick={() => setAvatar(a)}
								className={[
									"text-2xl p-1.5 rounded-lg border transition-all",
									avatar === a
										? "border-primary bg-primary/10 scale-110"
										: "border-transparent hover:bg-accent",
								].join(" ")}
							>
								{a}
							</button>
						))}
					</div>
				</div>

				<div>
					<label htmlFor="agent-name" className="mb-1 block text-sm text-muted-foreground">
						Name
					</label>
					<input
						id="agent-name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full px-3 py-2 bg-input rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
						placeholder="Agent name"
						required
					/>
				</div>

				<div>
					<label htmlFor="agent-role" className="mb-1 block text-sm text-muted-foreground">
						Role
					</label>
					<input
						id="agent-role"
						type="text"
						value={role}
						onChange={(e) => setRole(e.target.value)}
						className="w-full px-3 py-2 bg-input rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
						placeholder="e.g. Infrastructure, Monitoring"
					/>
				</div>

				<div>
					<p className="mb-1 block text-sm text-muted-foreground">Level</p>
					<div className="flex gap-2">
						{LEVELS.map((l) => (
							<button
								key={l}
								type="button"
								onClick={() => setLevel(l)}
								className={[
									"text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors",
									level === l
										? "bg-primary text-primary-foreground border-primary"
										: "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground",
								].join(" ")}
							>
								{l}
							</button>
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
						disabled={loading || !name.trim()}
						className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
					>
						{loading ? "Creating..." : "Create Agent"}
					</button>
				</div>
			</form>
		</div>
	);
}
