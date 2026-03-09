import { useAuthActions } from "@convex-dev/auth/react";

export default function SignOut() {
	const { signOut } = useAuthActions();
	return (
		<button
			type="button"
			onClick={() => void signOut()}
			className="text-sm text-muted-foreground hover:text-foreground transition-colors"
		>
			Sign Out
		</button>
	);
}
