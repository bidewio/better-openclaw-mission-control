import React, { Component, type ReactNode } from "react";

interface Props {
	children?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div className="flex h-screen w-full items-center justify-center bg-background p-4 text-foreground dark">
					<div className="w-full max-w-md rounded-lg border border-red-500/20 bg-card p-6 shadow-xl">
						<div className="mb-4 flex items-center gap-3 text-red-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<title>Error icon</title>
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="8" x2="12" y2="12" />
								<line x1="12" y1="16" x2="12.01" y2="16" />
							</svg>
							<h2 className="text-xl font-semibold">Something went wrong</h2>
						</div>
						<p className="mb-6 text-sm text-muted-foreground">
							The application encountered an unexpected error.
						</p>
						<div className="mb-6 max-h-32 overflow-auto rounded bg-black/50 p-3 text-xs text-red-400">
							{this.state.error?.message || "Unknown error"}
						</div>
						<button
							onClick={() => window.location.reload()}
							className="w-full rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
							type="button"
						>
							Reload Application
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
