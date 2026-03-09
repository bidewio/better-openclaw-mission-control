import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
	throw new Error("Boom from child");
}

describe("ErrorBoundary", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("renders children when no error is thrown", () => {
		render(
			<ErrorBoundary>
				<div>Healthy child</div>
			</ErrorBoundary>,
		);

		expect(screen.getByText("Healthy child")).toBeTruthy();
	});

	it("renders the fallback UI when a child throws", () => {
		render(
			<ErrorBoundary>
				<Boom />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeTruthy();
		expect(screen.getByText("The application encountered an unexpected error.")).toBeTruthy();
		expect(screen.getByText("Boom from child")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Reload Application" })).toBeTruthy();
	});
});
