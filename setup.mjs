#!/usr/bin/env node

/**
 * Mission Control Hook Auto-Installer
 *
 * This script automatically installs the OpenClaw hook for Mission Control.
 * It copies the hook handler to ~/.openclaw/hooks/mission-control/
 * and updates the OpenClaw configuration to enable it.
 *
 * Usage: node setup.mjs [--url <webhook-url>]
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_WEBHOOK_URL = "http://127.0.0.1:3211/openclaw/event";

function main() {
	// Parse CLI args
	const args = process.argv.slice(2);
	let webhookUrl = DEFAULT_WEBHOOK_URL;
	const urlIdx = args.indexOf("--url");
	if (urlIdx !== -1 && args[urlIdx + 1]) {
		webhookUrl = args[urlIdx + 1];
	}

	const homeDir = os.homedir();
	const openclawDir = path.join(homeDir, ".openclaw");
	const hooksDir = path.join(openclawDir, "hooks", "mission-control");
	const configPath = path.join(openclawDir, "openclaw.json");

	console.log("🎯 Mission Control Hook Installer");
	console.log("─".repeat(40));

	// 1. Create hooks directory
	fs.mkdirSync(hooksDir, { recursive: true });
	console.log(`  ✅ Created hooks directory: ${hooksDir}`);

	// 2. Copy hook handler
	const srcHandler = path.join(
		__dirname,
		"hooks",
		"mission-control",
		"handler.ts",
	);
	const destHandler = path.join(hooksDir, "handler.ts");

	if (fs.existsSync(srcHandler)) {
		fs.copyFileSync(srcHandler, destHandler);
		console.log(`  ✅ Copied hook handler to: ${destHandler}`);
	} else {
		console.warn(
			`  ⚠️  Hook handler not found at: ${srcHandler}`,
		);
	}

	// 3. Copy HOOK.md
	const srcMd = path.join(
		__dirname,
		"hooks",
		"mission-control",
		"HOOK.md",
	);
	const destMd = path.join(hooksDir, "HOOK.md");

	if (fs.existsSync(srcMd)) {
		fs.copyFileSync(srcMd, destMd);
		console.log(`  ✅ Copied HOOK.md to: ${destMd}`);
	}

	// 4. Update OpenClaw config
	let config = {};
	if (fs.existsSync(configPath)) {
		try {
			const raw = fs.readFileSync(configPath, "utf-8");
			// Strip JSON comments (// and /* */)
			const stripped = raw
				.replace(/\/\/.*$/gm, "")
				.replace(/\/\*[\s\S]*?\*\//g, "");
			config = JSON.parse(stripped);
			console.log(`  ✅ Read existing config: ${configPath}`);
		} catch (e) {
			console.warn(
				`  ⚠️  Could not parse existing config, creating new one`,
			);
			config = {};
		}
	}

	// Ensure hooks structure exists
	if (!config.hooks) config.hooks = {};
	if (!config.hooks.internal) config.hooks.internal = {};
	config.hooks.internal.enabled = true;
	if (!config.hooks.internal.entries) config.hooks.internal.entries = {};

	// Set or update mission-control entry
	config.hooks.internal.entries["mission-control"] = {
		enabled: true,
		env: {
			MISSION_CONTROL_URL: webhookUrl,
		},
	};

	// Write back
	fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
	console.log(`  ✅ Updated config: ${configPath}`);

	console.log("");
	console.log("─".repeat(40));
	console.log(`  🎯 Hook installed! Webhook URL: ${webhookUrl}`);
	console.log("");
	console.log("  Next steps:");
	console.log("  1. Start Mission Control: npm run dev");
	console.log("  2. Restart OpenClaw gateway to load the hook");
	console.log("");
}

main();
