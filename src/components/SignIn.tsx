import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export default function SignInForm() {
	const { signIn } = useAuthActions();
	const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await signIn("password", { email, password, flow });
		} catch {
			setError(flow === "signIn" ? "Invalid email or password" : "Could not create account");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="dark min-h-screen flex items-center justify-center bg-background p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-foreground">🎯 Mission Control</h1>
					<p className="text-muted-foreground mt-2">Better OpenClaw Agent Dashboard</p>
				</div>

				<form
					onSubmit={handleSubmit}
					className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-lg"
				>
					<h2 className="text-lg font-semibold text-card-foreground">
						{flow === "signIn" ? "Sign In" : "Create Account"}
					</h2>

					{error && (
						<div className="bg-destructive/10 text-destructive text-sm rounded-lg px-3 py-2">
							{error}
						</div>
					)}

					<div>
						<label htmlFor="sign-in-email" className="block text-sm text-muted-foreground mb-1">
							Email
						</label>
						<input
							id="sign-in-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-3 py-2 bg-input rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="you@example.com"
							required
						/>
					</div>

					<div>
						<label htmlFor="sign-in-password" className="block text-sm text-muted-foreground mb-1">
							Password
						</label>
						<input
							id="sign-in-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-3 py-2 bg-input rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="••••••••"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
					>
						{loading ? "Loading..." : flow === "signIn" ? "Sign In" : "Create Account"}
					</button>

					<p className="text-sm text-center text-muted-foreground">
						{flow === "signIn" ? (
							<>
								Don't have an account?{" "}
								<button
									type="button"
									onClick={() => setFlow("signUp")}
									className="text-primary underline"
								>
									Sign Up
								</button>
							</>
						) : (
							<>
								Already have an account?{" "}
								<button
									type="button"
									onClick={() => setFlow("signIn")}
									className="text-primary underline"
								>
									Sign In
								</button>
							</>
						)}
					</p>
				</form>
			</div>
		</div>
	);
}
