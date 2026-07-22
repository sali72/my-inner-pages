# User Model

## Overview

Persistent structured memory per user — a compact JSON summary of recurring patterns, emotional tone, thinking style, and conversational guidance. Updated periodically via LLM in the background.

Gives the AI companion continuity across journal entries and chat sessions without vector DBs or RAG.

## Architecture

```
Journal created ──> BackgroundTasks
                         │
               ┌─────────▼──────────┐
               │  UserModelUpdater  │
               │  (memory/services) │
               └─────────┬──────────┘
                         │
              needs_update()? ──> no ──> done
                         │ yes
               ┌─────────▼──────────┐
               │  LLM (conservative │
               │  update prompt)    │
               └─────────┬──────────┘
                         │
               ┌─────────▼──────────┐
               │  _parse_and_merge  │
               │  → upsert to Mongo │
               └────────────────────┘

Chat session ──> MemoryFacade
                      │
            ┌─────────▼──────────┐
            │  build_injected_   │
            │  context()         │
            │  → JSON blocks:    │
            │    --- user_model  │
            │    --- recent_     │
            │        entries     │
            │    --- chat_history│
            └────────────────────┘
```

## Update Triggers

- **Every N entries** (default: 5) since last update
- **Every M words** (default: 5000) written since last update
- Whichever comes first

Configured via `MEMORY_UPDATE_AFTER_ENTRIES` and `MEMORY_UPDATE_AFTER_WORDS` env vars.

## Update Behavior

The LLM is instructed to:

- Preserve stable traits unless strong repeated evidence contradicts them
- Avoid overreacting to single emotional entries
- Use tentative language ("may", "tends to")
- Never use clinical or diagnostic framing
- Return valid JSON only

## Context Injection

`MemoryFacade.build_injected_context()` produces three labelled JSON blocks for LLM prompts:

```
--- user_model ---
{...}

--- recent_entries ---
[{...}]

--- chat_history ---
[{...}]
```

Injected into the chat system prompt on every WebSocket connection.

## Dev Endpoints

Available in non-production environments only:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v0/memory/update-user-model` | Manually trigger LLM update |
| GET | `/api/v0/memory/user-model` | Inspect current model |

## Philosophy

The model describes **patterns, tendencies, and recurring themes** — never fixed identity labels or clinical diagnoses. Designed to support self-understanding, not identity reduction.
