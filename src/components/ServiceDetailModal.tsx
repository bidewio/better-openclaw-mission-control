/**
 * ServiceDetailModal — modal for viewing a service's full details,
 * editing environment variable overrides, and copying Docker commands.
 */

import { IconCheck, IconCopy, IconExternalLink, IconX } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

interface ServiceDetailModalProps {
	service: Doc<"stackServices">;
	onClose: () => void;
}

export default function ServiceDetailModal({ service, onClose }: ServiceDetailModalProps) {
	const updateEnv = useMutation(api.stacks.updateServiceEnv);
	const [envText, setEnvText] = useState(service.envOverrides ?? "");
	const [saving, setSaving] = useState(false);
	const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

	const handleSaveEnv = useCallback(async () => {
		setSaving(true);
		try {
			await updateEnv({ serviceId: service._id, envOverrides: envText });
		} finally {
			setSaving(false);
		}
	}, [updateEnv, service._id, envText]);

	const copyToClipboard = useCallback(async (text: string, label: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedCmd(label);
		setTimeout(() => setCopiedCmd(null), 2000);
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-lg max-h-[80vh] rounded-xl border border-border bg-background shadow-2xl flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
					<div className="flex items-center gap-2">
						<span className="text-xl">{service.icon}</span>
						<div>
							<h2 className="text-lg font-semibold text-foreground">{service.name}</h2>
							<p className="text-xs text-muted-foreground font-mono">
								{service.image
									? `${service.image}:${service.imageTag ?? "latest"}`
									: service.gitRepoUrl
										? service.gitRepoUrl.replace("https://github.com/", "").replace(".git", "")
										: service.serviceId}
							</p>
						</div>
					</div>
					<button
						aria-label="Close service details modal"
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						<IconX size={18} />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
					{/* Info */}
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<span className="text-xs text-muted-foreground block">Category</span>
							<span className="text-foreground capitalize">{service.category}</span>
						</div>
						<div>
							<span className="text-xs text-muted-foreground block">Added By</span>
							<span className="text-foreground capitalize">
								{service.addedBy}
								{service.dependencyOf && (
									<span className="text-muted-foreground"> ({service.dependencyOf})</span>
								)}
							</span>
						</div>
						<div>
							<span className="text-xs text-muted-foreground block">Status</span>
							<span
								className={
									service.status === "running"
										? "text-green-500"
										: service.status === "stopped"
											? "text-red-400"
											: "text-muted-foreground"
								}
							>
								{service.status ?? "unknown"}
							</span>
						</div>
						<div>
							<span className="text-xs text-muted-foreground block">Source</span>
							<span className="text-foreground text-xs font-mono">
								{service.image ? "Docker Image" : service.gitRepoUrl ? "Git Repository" : "Unknown"}
							</span>
						</div>
					</div>

					{/* Ports */}
					{service.ports.length > 0 && (
						<div>
							<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
								Ports
							</h3>
							<div className="space-y-1">
								{service.ports.map((p) => (
									<div
										key={`${p.host ?? "internal"}-${p.container}-${p.description ?? "port"}`}
										className="flex items-center gap-2 text-sm rounded bg-secondary/50 px-3 py-1.5"
									>
										<code className="text-foreground">
											{p.host ? `${p.host}:` : ""}
											{p.container}
										</code>
										<span className="text-muted-foreground text-xs">{p.description}</span>
										{p.exposed && <span className="ml-auto text-xs text-primary">exposed</span>}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Docker commands */}
					<div>
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
							Docker Commands
						</h3>
						<div className="space-y-2">
							{[
								{ label: "Logs", cmd: `docker compose logs -f ${service.serviceId}` },
								{ label: "Restart", cmd: `docker compose restart ${service.serviceId}` },
								{ label: "Stop", cmd: `docker compose stop ${service.serviceId}` },
								{ label: "Shell", cmd: `docker compose exec ${service.serviceId} sh` },
							].map(({ label, cmd }) => (
								<button
									key={label}
									type="button"
									onClick={() => copyToClipboard(cmd, label)}
									className="flex items-center gap-2 w-full text-left rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm font-mono text-foreground hover:bg-secondary/60 transition-colors"
								>
									<span className="flex-1 truncate">{cmd}</span>
									{copiedCmd === label ? (
										<IconCheck size={14} className="text-green-500 shrink-0" />
									) : (
										<IconCopy size={14} className="text-muted-foreground shrink-0" />
									)}
								</button>
							))}
						</div>
					</div>

					{/* Env overrides */}
					<div>
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
							Environment Overrides
						</h3>
						<p className="text-xs text-muted-foreground mb-2">
							Add custom environment variables for this service (KEY=value format, one per line).
						</p>
						<textarea
							value={envText}
							onChange={(e) => setEnvText(e.target.value)}
							placeholder={"MY_CUSTOM_VAR=value\nANOTHER_VAR=123"}
							rows={5}
							className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary resize-y"
						/>
						<button
							type="button"
							onClick={handleSaveEnv}
							disabled={saving || envText === (service.envOverrides ?? "")}
							className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{saving ? "Saving..." : "Save Env Overrides"}
						</button>
					</div>

					{/* Docs link */}
					{service.docsUrl && (
						<a
							href={service.docsUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 text-sm text-primary hover:underline"
						>
							<IconExternalLink size={14} />
							Documentation
						</a>
					)}
				</div>
			</div>
		</div>
	);
}
