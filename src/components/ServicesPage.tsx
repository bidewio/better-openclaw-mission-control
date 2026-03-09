/**
 * ServicesPage — grid view of all services in the selected stack.
 * Shows service cards with status indicators, ports, and action buttons.
 */

import { IconExternalLink, IconSettings } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import ServiceDetailModal from "./ServiceDetailModal";
import StackSelector from "./StackSelector";

interface ServicesPageProps {
	onRegisterStack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
	running: "bg-green-500",
	stopped: "bg-red-500",
	error: "bg-red-500",
	unknown: "bg-muted-foreground/50",
};

const CATEGORY_COLORS: Record<string, string> = {
	database: "bg-blue-500/20 text-blue-400",
	ai: "bg-purple-500/20 text-purple-400",
	"ai-platform": "bg-purple-500/20 text-purple-400",
	"coding-agent": "bg-indigo-500/20 text-indigo-400",
	monitoring: "bg-yellow-500/20 text-yellow-400",
	proxy: "bg-cyan-500/20 text-cyan-400",
	browser: "bg-orange-500/20 text-orange-400",
	search: "bg-emerald-500/20 text-emerald-400",
	"vector-db": "bg-violet-500/20 text-violet-400",
	automation: "bg-teal-500/20 text-teal-400",
	media: "bg-pink-500/20 text-pink-400",
	communication: "bg-sky-500/20 text-sky-400",
	security: "bg-red-500/20 text-red-400",
	storage: "bg-amber-500/20 text-amber-400",
	"dev-tools": "bg-slate-500/20 text-slate-400",
};

export default function ServicesPage({ onRegisterStack }: ServicesPageProps) {
	const [selectedStackId, setSelectedStackId] = useState<Id<"stacks"> | null>(null);
	const [selectedService, setSelectedService] = useState<Doc<"stackServices"> | null>(null);

	const services = useQuery(
		api.stacks.listStackServices,
		selectedStackId ? { stackId: selectedStackId } : "skip",
	);

	const userServices = services?.filter((s) => s.addedBy === "user") ?? [];
	const depServices = services?.filter((s) => s.addedBy !== "user") ?? [];

	return (
		<div className="flex-1 overflow-y-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-foreground">Services</h2>
			</div>

			<StackSelector
				selectedStackId={selectedStackId}
				onSelect={setSelectedStackId}
				onRegister={onRegisterStack}
			/>

			{selectedStackId && services && (
				<>
					{/* User-selected services */}
					{userServices.length > 0 && (
						<section>
							<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
								Selected Services ({userServices.length})
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
								{userServices.map((svc) => (
									<ServiceCard
										key={svc._id}
										service={svc}
										onClick={() => setSelectedService(svc)}
									/>
								))}
							</div>
						</section>
					)}

					{/* Auto-added dependencies */}
					{depServices.length > 0 && (
						<section>
							<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
								Auto-added Dependencies ({depServices.length})
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
								{depServices.map((svc) => (
									<ServiceCard
										key={svc._id}
										service={svc}
										onClick={() => setSelectedService(svc)}
									/>
								))}
							</div>
						</section>
					)}

					{services.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-12">
							No services found in this stack.
						</p>
					)}
				</>
			)}

			{!selectedStackId && (
				<p className="text-sm text-muted-foreground text-center py-12">
					Select a stack above to view its services.
				</p>
			)}

			{selectedService && (
				<ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} />
			)}
		</div>
	);
}

function ServiceCard({ service, onClick }: { service: Doc<"stackServices">; onClick: () => void }) {
	const categoryClass = CATEGORY_COLORS[service.category] ?? "bg-secondary text-muted-foreground";
	const statusColor = STATUS_COLORS[service.status ?? "unknown"] ?? STATUS_COLORS.unknown;

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4 text-left hover:border-primary/50 hover:bg-secondary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group"
		>
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-2">
					<span className="text-lg">{service.icon}</span>
					<div>
						<span className="font-medium text-foreground text-sm">{service.name}</span>
						<p className="text-xs text-muted-foreground font-mono">
							{service.image}:{service.imageTag}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<div
						className={`h-2 w-2 rounded-full ${statusColor}`}
						title={service.status ?? "unknown"}
					/>
					<IconSettings
						size={14}
						className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
					/>
				</div>
			</div>

			<div className="flex items-center gap-2 flex-wrap">
				<span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${categoryClass}`}>
					{service.category}
				</span>
				{service.ports.length > 0 && (
					<span className="text-[10px] text-muted-foreground">
						{service.ports
							.map((p) => (p.host ? `${p.host}:${p.container}` : `:${p.container}`))
							.join(", ")}
					</span>
				)}
				{service.dependencyOf && (
					<span className="text-[10px] text-muted-foreground italic">
						req. by {service.dependencyOf}
					</span>
				)}
			</div>

			{service.docsUrl && (
				<div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
					<IconExternalLink size={12} />
					Docs
				</div>
			)}
		</button>
	);
}
