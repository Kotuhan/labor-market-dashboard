---
title: Claude Code VSCode Extension - Conversation/Session Title Management
domain: troubleshooting
tech: [claude-code, vscode, anthropic]
area: [ide, developer-tools, conversation-management]
staleness: 3months
created: 2026-02-17
updated: 2026-02-17
sources:
  - https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
  - https://github.com/anthropics/claude-code/issues/7441
  - https://github.com/anthropics/claude-code/issues/11145
  - https://github.com/anthropics/claude-code/issues/9198
  - https://code.claude.com/docs/en/vs-code
  - https://github.com/AlexZan/claude-chats
  - https://marketplace.visualstudio.com/items?itemName=AlexZanfir.claude-chats
---

# Claude Code VSCode Extension - Conversation/Session Title Management

## Overview

This document covers the current state of conversation and session title management in the Claude Code VSCode extension and CLI (as of February 2026). The tab title in VSCode defaults to the first message sent, truncated. Renaming VSCode tab titles is a highly requested but only partially implemented feature.

## Key Findings

### The Problem

When a Claude Code conversation is open as an editor tab in VSCode, the tab title is derived from the **first message you sent**, truncated to fit. There is no built-in way in the VSCode extension UI to rename this tab title directly.

### What IS Available: `/rename` in the CLI

The CLI (command-line interface) **does have a `/rename` command**, implemented in late 2025 (around version 2.1.x):

- **`/rename`** (without arguments) — auto-generates a session name from the conversation context
- **`/rename My Custom Name`** — sets a custom name for the current session
- The `/resume` screen supports keyboard shortcut **`R`** to rename a session and **`P`** to preview it
- Sessions can be resumed by name: `claude --resume "My Custom Name"` or `/resume <name>` in REPL

However, this command is available in the **CLI terminal mode**, not necessarily surfaced in the VSCode graphical panel. The effect on the VSCode tab title is not guaranteed.

### VSCode Extension Tab Title — Still Unresolved

As of early 2026, renaming the tab title within the VSCode extension is **still an open feature request** (GitHub issue #11145, last activity January 2026, 38+ upvotes). Key facts:

- The tab title comes from the first message and is cached by the VSCode extension
- There is no right-click rename option on the tab itself
- There is no built-in command in the extension UI to rename the current conversation's tab
- The `Past Conversations` dropdown lets you browse by time/keyword, but not rename

### Third-Party Workaround: "Claude Chats" Extension

A community-built VSCode extension called **"Claude Chats"** (by AlexZanfir) provides rename functionality:

- Install: `AlexZanfir.claude-chats` from VSCode Marketplace
- Rename via: status bar button, right-click on editor tabs, or Command Palette ("Rename Current Conversation")
- Mechanism: directly modifies Claude Code's `.jsonl` conversation files (adds/updates the summary message)
- Creates automatic backups before modifications
- **Caveat**: After renaming, you must **close and reopen the Claude Code chat tab** to see the updated title (Claude Code caches tab names in memory)

### CHANGELOG Highlights (CLI `/rename` Evolution)

| Version | Change |
|---------|--------|
| 2.1.41 | Improved `/rename` to auto-generate session name from conversation context when called without arguments |
| 2.1.19 | Fixed `/rename` and `/tag` not updating the correct session when resuming from a different directory (e.g., git worktrees) |
| 2.1.33 | VSCode: Added git branch and message count to the session picker, with support for searching by branch name |
| 2.1.16 | VSCode: Fixed duplicate sessions appearing in the session list when starting a new conversation |

## Current Options Summary

| Method | Works? | Notes |
|--------|--------|-------|
| `/rename` slash command in VSCode panel | Partially | Available if using CLI mode (`claudeCode.useTerminal: true`); may not update tab title |
| `/rename` in terminal (`claude` CLI) | Yes for CLI | Renames session for `/resume` picker; VSCode tab title may not update |
| VSCode extension UI rename (built-in) | No | Not implemented; open feature request #11145 |
| "Claude Chats" third-party extension | Yes | Updates tab title after close/reopen; requires manual reload |
| No action | Default | Tab shows first message, truncated |

## Practical Recommendations

### Option 1: Use `/rename` via CLI (immediate workaround)

If you have access to the integrated terminal, run `claude` there and use:
```
/rename My Descriptive Session Name
```
This renames the session in the history picker. Whether it updates the live VSCode tab title depends on the current extension version.

### Option 2: Install the "Claude Chats" Extension

For VSCode tab title renaming:
1. Install `AlexZanfir.claude-chats` from the VSCode Marketplace
2. Use the Command Palette: "Rename Current Conversation"
3. Close and reopen the Claude Code tab to see the change

### Option 3: Use Terminal Mode

Set `claudeCode.useTerminal: true` in VSCode settings to use Claude Code in CLI mode. This gives full access to `/rename` and all other CLI slash commands.

### Option 4: Upvote the Feature Request

If you need this in the official extension UI, upvote GitHub issue #11145 or #7441.

## Common Issues

**Q: I typed `/rename` in the VSCode panel but nothing happened.**
A: The VSCode graphical panel exposes only a subset of slash commands. Check the command menu (`/`) to see what's available. Full slash command support requires CLI mode.

**Q: The tab title still shows the old name after renaming with "Claude Chats".**
A: Close the Claude Code tab and reopen it. The extension caches the tab name and requires a reload.

**Q: Can I rename a conversation BEFORE starting it?**
A: Not directly. Start the conversation, then use `/rename` or the "Claude Chats" extension to rename it afterward.

## Sources

- [Claude Code CHANGELOG (official)](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [GitHub Issue #7441 - Rename the conversation (CLOSED/COMPLETED)](https://github.com/anthropics/claude-code/issues/7441)
- [GitHub Issue #11145 - Rename tabs in VSCode Extension (OPEN)](https://github.com/anthropics/claude-code/issues/11145)
- [GitHub Issue #9198 - Add ability to manually rename conversation titles (CLOSED as duplicate)](https://github.com/anthropics/claude-code/issues/9198)
- [Official VSCode Extension Documentation](https://code.claude.com/docs/en/vs-code)
- [Claude Chats Extension (GitHub)](https://github.com/AlexZan/claude-chats)
- [Claude Chats Extension (VSCode Marketplace)](https://marketplace.visualstudio.com/items?itemName=AlexZanfir.claude-chats)
