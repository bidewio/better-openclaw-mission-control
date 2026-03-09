import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<ConvexAuthProvider client={convex}>
			<ErrorBoundary>
				<Suspense
					fallback={
						<div className="flex h-screen w-screen items-center justify-center bg-background text-foreground dark">
							Loading Mission Control...
						</div>
					}
				>
					<App />
				</Suspense>
			</ErrorBoundary>
		</ConvexAuthProvider>
	</StrictMode>,
);
