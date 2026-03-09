import { IconCheck, IconChefHat, IconCopy, IconX } from "@tabler/icons-react";
import { useState } from "react";

interface ClawRecipesTrayProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function ClawRecipesTray({ isOpen, onClose }: ClawRecipesTrayProps) {
	const [workspaceRecipesDir, setWorkspaceRecipesDir] = useState("recipes");
	const [workspaceAgentsDir, setWorkspaceAgentsDir] = useState("agents");
	const [workspaceSkillsDir, setWorkspaceSkillsDir] = useState("skills");
	const [workspaceTeamsDir, setWorkspaceTeamsDir] = useState("teams");
	const [autoInstallMissingSkills, setAutoInstallMissingSkills] = useState(false);
	const [confirmAutoInstall, setConfirmAutoInstall] = useState(true);
	const [cronInstallation, setCronInstallation] = useState<"off" | "prompt" | "on">("prompt");

	const [copiedCommand, setCopiedCommand] = useState(false);
	const [copiedJson, setCopiedJson] = useState(false);

	const generateJson = () => {
		return JSON.stringify(
			{
				workspaceRecipesDir,
				workspaceAgentsDir,
				workspaceSkillsDir,
				workspaceTeamsDir,
				autoInstallMissingSkills,
				confirmAutoInstall,
				cronInstallation,
			},
			null,
			2,
		);
	};

	const handleCopyCommand = async () => {
		await navigator.clipboard.writeText("openclaw plugins install @jiggai/recipes");
		setCopiedCommand(true);
		setTimeout(() => setCopiedCommand(false), 2000);
	};

	const handleCopyJson = async () => {
		await navigator.clipboard.writeText(generateJson());
		setCopiedJson(true);
		setTimeout(() => setCopiedJson(false), 2000);
	};

	return (
		<div
			className={`fixed inset-y-0 right-0 w-[400px] bg-background border-l border-border shadow-2xl transition-transform duration-300 z-50 flex flex-col ${
				isOpen ? "translate-x-0" : "translate-x-full"
			}`}
		>
			<div className="flex items-center justify-between p-4 border-b border-border">
				<div className="flex items-center gap-2">
					<IconChefHat className="text-primary" size={24} />
					<h3 className="text-lg font-semibold text-foreground">ClawRecipes Setup</h3>
				</div>
				<button
					title="Close"
					type="button"
					onClick={onClose}
					className="p-1.5 hover:bg-accent rounded-md text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
				>
					<IconX size={20} />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-6 space-y-8">
				{/* Step 1: Installation */}
				<section className="space-y-3">
					<h4 className="text-sm font-medium text-foreground uppercase tracking-wider">
						Step 1: Install Plugin
					</h4>
					<p className="text-sm text-muted-foreground">
						Run this command in your terminal to install the official ClawRecipes plugin into your
						OpenClaw Gateway.
					</p>
					<div className="relative group">
						<pre className="bg-secondary/50 p-3 rounded-md text-sm font-mono text-foreground overflow-x-auto border border-border">
							openclaw plugins install @jiggai/recipes
						</pre>
						<button
							type="button"
							onClick={handleCopyCommand}
							className="absolute right-2 top-2 p-1.5 bg-background border border-border rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						>
							{copiedCommand ? <IconCheck size={16} /> : <IconCopy size={16} />}
						</button>
					</div>
				</section>

				{/* Step 2: Configuration */}
				<section className="space-y-4">
					<h4 className="text-sm font-medium text-foreground uppercase tracking-wider">
						Step 2: Configuration Options
					</h4>
					<p className="text-sm text-muted-foreground mb-4">
						Customize how ClawRecipes structures your agent teams and workspace files.
					</p>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<label
								htmlFor="workspace-recipes-dir"
								className="text-xs font-medium text-foreground block"
							>
								Workspace Recipes Directory
							</label>
							<input
								id="workspace-recipes-dir"
								title="Workspace Recipes Directory"
								type="text"
								value={workspaceRecipesDir}
								onChange={(e) => setWorkspaceRecipesDir(e.target.value)}
								className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
							/>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor="workspace-teams-dir"
								className="text-xs font-medium text-foreground block"
							>
								Workspace Teams Directory
							</label>
							<input
								id="workspace-teams-dir"
								title="Workspace Teams Directory"
								type="text"
								value={workspaceTeamsDir}
								onChange={(e) => setWorkspaceTeamsDir(e.target.value)}
								className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label
									htmlFor="workspace-agents-dir"
									className="text-xs font-medium text-foreground block"
								>
									Agents Directory
								</label>
								<input
									id="workspace-agents-dir"
									title="Agents Directory"
									type="text"
									value={workspaceAgentsDir}
									onChange={(e) => setWorkspaceAgentsDir(e.target.value)}
									className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
								/>
							</div>
							<div className="space-y-1.5">
								<label
									htmlFor="workspace-skills-dir"
									className="text-xs font-medium text-foreground block"
								>
									Skills Directory
								</label>
								<input
									id="workspace-skills-dir"
									title="Skills Directory"
									type="text"
									value={workspaceSkillsDir}
									onChange={(e) => setWorkspaceSkillsDir(e.target.value)}
									className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
								/>
							</div>
						</div>

						<div className="pt-2 space-y-3">
							<label className="flex items-center gap-2 cursor-pointer group">
								<input
									type="checkbox"
									checked={autoInstallMissingSkills}
									onChange={(e) => setAutoInstallMissingSkills(e.target.checked)}
									className="rounded border-border bg-secondary/50 text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-background disabled:opacity-50"
								/>
								<span className="text-sm text-foreground group-hover:text-primary transition-colors">
									Auto-install Missing Skills
								</span>
							</label>

							<label className="flex items-center gap-2 cursor-pointer group">
								<input
									type="checkbox"
									checked={confirmAutoInstall}
									onChange={(e) => setConfirmAutoInstall(e.target.checked)}
									className="rounded border-border bg-secondary/50 text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-background disabled:opacity-50"
									disabled={!autoInstallMissingSkills}
								/>
								<span className="text-sm text-foreground group-hover:text-primary transition-colors">
									Require Confirmation for Auto-install
								</span>
							</label>

							<div className="space-y-1.5 pt-2">
								<label
									htmlFor="cron-installation"
									className="text-xs font-medium text-foreground block"
								>
									Cron Installation Prompt
								</label>
								<select
									id="cron-installation"
									title="Cron Installation Prompt"
									value={cronInstallation}
									onChange={(e) => setCronInstallation(e.target.value as "off" | "prompt" | "on")}
									className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow [&>option]:bg-background"
								>
									<option value="off">Off (Never prompt)</option>
									<option value="prompt">Prompt (Ask user)</option>
									<option value="on">On (Always enable)</option>
								</select>
							</div>
						</div>
					</div>
				</section>

				{/* Step 3: Export */}
				<section className="space-y-3 pt-4 border-t border-border">
					<h4 className="text-sm font-medium text-foreground uppercase tracking-wider">
						Step 3: Export Configuration
					</h4>
					<p className="text-sm text-muted-foreground mb-2">
						Copy this JSON and save it to your <code className="text-xs">openclaw.plugin.json</code>{" "}
						configuration file.
					</p>
					<div className="relative group">
						<pre className="bg-secondary/50 p-4 rounded-md text-xs font-mono text-foreground overflow-x-auto border border-border">
							{generateJson()}
						</pre>
						<button
							type="button"
							onClick={handleCopyJson}
							className="absolute right-2 top-2 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-md shadow-sm transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{copiedJson ? (
								<>
									<IconCheck size={14} /> Copied!
								</>
							) : (
								<>
									<IconCopy size={14} /> Copy JSON
								</>
							)}
						</button>
					</div>
				</section>
			</div>
		</div>
	);
}
