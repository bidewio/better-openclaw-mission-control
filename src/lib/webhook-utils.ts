/**
 * Webhook utility functions ported from the external mission-control repo.
 *
 * - `nextRetryDelay()` — compute exponential backoff with jitter (pure math, works anywhere)
 * - `verifyWebhookSignature()` — HMAC-SHA256 constant-time verification (Node crypto, server-only)
 * - Event type mapping constants for webhook dispatch
 */

// Backoff schedule in seconds: 30s, 5m, 30m, 2h, 8h
export const BACKOFF_SECONDS = [30, 300, 1800, 7200, 28800] as const;

export const DEFAULT_MAX_RETRIES = 5;

/**
 * Map internal event bus events to webhook event types.
 * Used when dispatching outbound webhooks.
 */
export const WEBHOOK_EVENT_MAP: Record<string, string> = {
	"activity.created": "activity",
	"notification.created": "notification",
	"agent.status_changed": "agent.status_change",
	"audit.security": "security",
	"task.created": "activity.task_created",
	"task.updated": "activity.task_updated",
	"task.deleted": "activity.task_deleted",
	"task.status_changed": "activity.task_status_changed",
};

/**
 * Compute the next retry delay in seconds, with ±20% jitter.
 * Pure math — works in any environment (browser or server).
 */
export function nextRetryDelay(attempt: number): number {
	const base = BACKOFF_SECONDS[Math.min(attempt, BACKOFF_SECONDS.length - 1)];
	const jitter = base * 0.2 * (2 * Math.random() - 1); // ±20%
	return Math.round(base + jitter);
}

/**
 * Build the specific webhook event type from a generic mapping.
 * E.g., "activity" + data.type="task_created" → "activity.task_created"
 */
export function resolveWebhookEventType(
	mapping: string,
	data?: { type?: string; action?: string },
): string {
	if (mapping === "activity" && data?.type) {
		return `activity.${data.type}`;
	}
	if (mapping === "notification" && data?.type) {
		return `notification.${data.type}`;
	}
	if (mapping === "security" && data?.action) {
		return `security.${data.action}`;
	}
	return mapping;
}

/**
 * Sign a webhook payload body with HMAC-SHA256.
 * Returns the signature header value: `sha256=<hex>`.
 *
 * NOTE: Uses Web Crypto API — works in both browser and Convex actions.
 */
export async function signWebhookPayload(secret: string, body: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
	const hex = Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `sha256=${hex}`;
}

/**
 * Verify a webhook signature using constant-time comparison.
 * Uses Web Crypto API — works in both browser and Convex actions.
 */
export async function verifyWebhookSignature(
	secret: string,
	rawBody: string,
	signatureHeader: string | null | undefined,
): Promise<boolean> {
	if (!signatureHeader || !secret) return false;

	const expected = await signWebhookPayload(secret, rawBody);

	// Constant-time comparison via byte-by-byte XOR
	if (signatureHeader.length !== expected.length) return false;

	let mismatch = 0;
	for (let i = 0; i < expected.length; i++) {
		mismatch |= signatureHeader.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return mismatch === 0;
}
