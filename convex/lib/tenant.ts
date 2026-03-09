import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";

const DEFAULT_TENANT_ID = "default";

type Ctx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

/**
 * Derive the tenant ID from the authenticated user's identity.
 * Falls back to "default" for unauthenticated webhook/system calls.
 *
 * In a multi-tenant setup, the identity's `subject` or a custom claim
 * would map to the tenant. For now, all authenticated users belong to
 * the "default" tenant.
 */
export async function getTenantId(ctx: Ctx): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		return DEFAULT_TENANT_ID;
	}
	// Use the identity's subject as tenant scoping key.
	// In a multi-tenant future, look up a tenant mapping table instead.
	return identity.subject ?? DEFAULT_TENANT_ID;
}

/**
 * Require authentication and return the tenant ID.
 * Throws if the user is not authenticated.
 */
export async function requireAuthTenantId(ctx: Ctx): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Authentication required");
	}
	return identity.subject ?? DEFAULT_TENANT_ID;
}

/**
 * Assert that a record belongs to the given tenant.
 * Throws a generic "not found" error to avoid leaking existence info.
 */
export function assertTenant<T extends { tenantId?: string }>(
	record: T | null,
	tenantId: string,
	entityName: string,
): asserts record is T & { tenantId: string } {
	if (!record || record.tenantId !== tenantId) {
		throw new Error(`${entityName} not found`);
	}
}

/**
 * Assert that a record belongs to the given tenant and return it.
 */
export function requireTenant<T extends { tenantId?: string }>(
	record: T | null,
	tenantId: string,
	entityName: string,
): T {
	if (!record || record.tenantId !== tenantId) {
		throw new Error(`${entityName} not found`);
	}
	return record;
}
