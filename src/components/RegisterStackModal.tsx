/**
 * RegisterStackModal — modal for registering a stack manifest in Mission Control.
 * Users can paste the JSON from stack-manifest.json or upload the file directly.
 */

import { IconFileUpload, IconX } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { useCallback, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

interface RegisterStackModalProps {
	onClose: () => void;
	onRegistered: () => void;
}

interface ManifestPortInput {
	container: string | number | undefined;
	host?: string | number | undefined;
	exposed?: boolean;
	description?: string;
}

interface ManifestServiceInput {
	id: string;
	name: string;
	category: string;
	icon: string;
	image: string;
	imageTag: string;
	ports?: ManifestPortInput[];
	docsUrl?: string;
	addedBy?: string;
	dependencyOf?: string;
}

interface ManifestSkillInput {
	id: string;
	name: string;
	path: string;
	content: string;
	serviceIds?: string[];
}

interface StackManifestInput {
	projectName?: string;
	domain?: string;
	deployment?: string;
	deploymentType?: string;
	platform?: string;
	proxy?: string;
	formatVersion?: string;
	services?: ManifestServiceInput[];
	skills?: ManifestSkillInput[];
}

export default function RegisterStackModal({ onClose, onRegistered }: RegisterStackModalProps) {
	const registerStack = useMutation(api.stacks.registerStack);
	const [jsonInput, setJsonInput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result;
			if (typeof text === "string") {
				setJsonInput(text);
				setError(null);
			}
		};
		reader.readAsText(file);
	}, []);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setError(null);

			let manifest: StackManifestInput;
			try {
				manifest = JSON.parse(jsonInput);
			} catch {
				setError("Invalid JSON. Paste the contents of stack-manifest.json.");
				return;
			}

			if (!manifest.projectName || !manifest.services) {
				setError("Missing required fields: projectName, services.");
				return;
			}

			setLoading(true);
			try {
				await registerStack({
					projectName: manifest.projectName,
					domain: manifest.domain,
					deployment: manifest.deployment,
					deploymentType: manifest.deploymentType,
					platform: manifest.platform,
					proxy: manifest.proxy,
					manifestVersion: manifest.formatVersion ?? "1",
					services: (manifest.services ?? []).map((s) => ({
						id: s.id,
						name: s.name,
						category: s.category,
						icon: s.icon,
						image: s.image,
						imageTag: s.imageTag,
						ports: (s.ports ?? []).map((p) => ({
							container: typeof p.container === "number" ? p.container : Number(p.container) || 0,
							host:
								p.host != null ? (typeof p.host === "number" ? p.host : Number(p.host)) : undefined,
							exposed: p.exposed ?? false,
							description: p.description ?? "",
						})),
						docsUrl: s.docsUrl,
						addedBy: s.addedBy ?? "user",
						dependencyOf: s.dependencyOf,
					})),
					skills: (manifest.skills ?? []).map((sk) => ({
						id: sk.id,
						name: sk.name,
						path: sk.path,
						content: sk.content,
						serviceIds: sk.serviceIds ?? [],
					})),
				});
				onRegistered();
			} catch (err) {
				setError(err instanceof Error ? err.message : "Registration failed");
			} finally {
				setLoading(false);
			}
		},
		[jsonInput, registerStack, onRegistered],
	);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-5 py-4">
					<h2 className="text-lg font-semibold text-foreground">Register Stack</h2>
					<button
						aria-label="Close"
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						<IconX size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
					<p className="text-sm text-muted-foreground">
						Paste the contents of <code className="text-xs">stack-manifest.json</code> or upload the
						file. This manifest is generated alongside your Docker Compose stack.
					</p>

					{/* File upload */}
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="flex items-center gap-2 w-full rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
					>
						<IconFileUpload size={18} />
						Upload stack-manifest.json
					</button>
					<input
						aria-label="Upload stack-manifest.json"
						ref={fileInputRef}
						type="file"
						accept=".json"
						onChange={handleFileUpload}
						className="hidden"
					/>

					{/* JSON textarea */}
					<textarea
						value={jsonInput}
						onChange={(e) => {
							setJsonInput(e.target.value);
							setError(null);
						}}
						placeholder='{"formatVersion": "1", "projectName": "...", ...}'
						rows={10}
						className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-y"
					/>

					{error && (
						<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!jsonInput.trim() || loading}
							className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{loading ? "Registering..." : "Register Stack"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
