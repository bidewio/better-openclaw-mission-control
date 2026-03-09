import { describe, expect, it, vi } from "vitest";

import { assertTenant, getTenantId, requireAuthTenantId, requireTenant } from "./tenant";

function createCtx(identity: { subject?: string } | null) {
	return {
		auth: {
			getUserIdentity: vi.fn().mockResolvedValue(identity),
		},
	} as never;
}

describe("tenant helpers", () => {
	it("falls back to the default tenant for unauthenticated access", async () => {
		await expect(getTenantId(createCtx(null))).resolves.toBe("default");
	});

	it("uses the authenticated subject as the tenant id", async () => {
		await expect(getTenantId(createCtx({ subject: "tenant-42" }))).resolves.toBe("tenant-42");
	});

	it("requires authentication for protected tenant access", async () => {
		await expect(requireAuthTenantId(createCtx(null))).rejects.toThrow("Authentication required");
	});

	it("returns the matching record from requireTenant", () => {
		const record = { id: "stack-1", tenantId: "tenant-42" };

		expect(requireTenant(record, "tenant-42", "Stack")).toBe(record);
	});

	it("throws a not found error when the tenant does not match", () => {
		expect(() => assertTenant({ tenantId: "tenant-7" }, "tenant-42", "Stack")).toThrow(
			"Stack not found",
		);
		expect(() => requireTenant(null, "tenant-42", "Stack")).toThrow("Stack not found");
	});
});
