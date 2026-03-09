import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
	signIn: vi.fn(),
}));

vi.mock("@convex-dev/auth/react", () => ({
	useAuthActions: () => ({
		signIn: authMocks.signIn,
	}),
}));

import SignInForm from "./SignIn";

describe("SignInForm", () => {
	beforeEach(() => {
		authMocks.signIn.mockReset();
	});

	it("submits sign-in credentials through the auth action", async () => {
		authMocks.signIn.mockResolvedValue(undefined);

		const { container } = render(<SignInForm />);
		const emailInput = screen.getByPlaceholderText("you@example.com");
		const passwordInput = container.querySelector('input[type="password"]');

		if (!(passwordInput instanceof HTMLInputElement)) {
			throw new Error("Password input not found");
		}

		fireEvent.change(emailInput, { target: { value: "agent@example.com" } });
		fireEvent.change(passwordInput, { target: { value: "super-secret" } });
		fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(authMocks.signIn).toHaveBeenCalledWith("password", {
				email: "agent@example.com",
				password: "super-secret",
				flow: "signIn",
			});
		});
		expect(screen.queryByText("Invalid email or password")).toBeNull();
	});

	it("shows the sign-up error message when account creation fails", async () => {
		authMocks.signIn.mockRejectedValueOnce(new Error("Rejected"));

		const { container } = render(<SignInForm />);
		fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

		const emailInput = screen.getByPlaceholderText("you@example.com");
		const passwordInput = container.querySelector('input[type="password"]');

		if (!(passwordInput instanceof HTMLInputElement)) {
			throw new Error("Password input not found");
		}

		fireEvent.change(emailInput, { target: { value: "new-user@example.com" } });
		fireEvent.change(passwordInput, { target: { value: "super-secret" } });
		fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

		await waitFor(() => {
			expect(authMocks.signIn).toHaveBeenCalledWith("password", {
				email: "new-user@example.com",
				password: "super-secret",
				flow: "signUp",
			});
		});
		expect(screen.getByText("Could not create account")).toBeTruthy();
	});
});
