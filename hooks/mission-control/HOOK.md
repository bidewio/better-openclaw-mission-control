---
name: mission-control
description: "Sync agent lifecycle events to Better OpenClaw Mission Control dashboard"
homepage: https://github.com/bidewio/better-openclaw
metadata:
  {
    "openclaw":
      {
        "emoji": "📊",
        "events": ["gateway:startup", "agent:bootstrap", "command:new"],
        "install": [{ "id": "user", "kind": "user", "label": "User-installed hook" }],
      },
  }
---

# Mission Control Integration

Sends agent lifecycle events to the Better OpenClaw Mission Control Convex backend for real-time task tracking.

## How It Works

1. On `gateway:startup`, registers a persistent listener via `onAgentEvent()`
2. The listener watches for lifecycle events (`stream: "lifecycle"`)
3. On `phase: "start"`, `"end"`, or `"error"`, POSTs to Mission Control
4. Tool usage and document creation events are also captured

## Configuration

Add to `~/.openclaw/openclaw.json`:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "mission-control": {
          "enabled": true,
          "env": {
            "MISSION_CONTROL_URL": "http://127.0.0.1:3211/openclaw/event"
          }
        }
      }
    }
  }
}
```

For production (Convex cloud), use:
```json
"MISSION_CONTROL_URL": "https://your-project.convex.site/openclaw/event"
```

## What It Does

- On agent start: Creates task in Mission Control (status: in_progress)
- On progress: Logs tool usage and intermediate messages
- On agent end: Marks task as done or needs review
- On error: Marks task for review with error details
- On file write: Creates document entry with content and type detection

## Automatic Setup

Run `npm run setup` in the mission-control package to automatically install this hook.

## Disabling

```bash
openclaw hooks disable mission-control
```
