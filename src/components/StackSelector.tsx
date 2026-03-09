/**
 * StackSelector — dropdown to pick which registered stack to view,
 * plus a button to register a new stack.
 */

import { IconPlus, IconServer } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface StackSelectorProps {
	selectedStackId: Id<"stacks"> | null;
	onSelect: (id: Id<"stacks">) => void;
	onRegister: () => void;
}

export default function StackSelector({
	selectedStackId,
	onSelect,
	onRegister,
}: StackSelectorProps) {
	const stacks = useQuery(api.stacks.listStacks, {});

	if (!stacks) return null;

	if (stacks.length === 0) {
		return (
			<div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-border bg-secondary/30">
				<IconServer size={20} className="text-muted-foreground" />
				<span className="text-sm text-muted-foreground flex-1">No stacks registered yet</span>
				<button
					type="button"
					onClick={onRegister}
					className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
				>
					<IconPlus size={14} />
					Register Stack
				</button>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<select
				value={selectedStackId ?? ""}
				onChange={(e) => {
					if (e.target.value) onSelect(e.target.value as Id<"stacks">);
				}}
				className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary [&>option]:bg-background"
			>
				<option value="" disabled>
					Select a stack...
				</option>
				{stacks.map((stack) => (
					<option key={stack._id} value={stack._id}>
						{stack.projectName}
						{stack.domain ? ` (${stack.domain})` : ""}
						{" — "}
						{new Date(stack.registeredAt).toLocaleDateString()}
					</option>
				))}
			</select>
			<button
				type="button"
				onClick={onRegister}
				className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
				title="Register new stack"
			>
				<IconPlus size={16} />
			</button>
		</div>
	);
}
