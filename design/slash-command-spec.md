# Slash Command Spec

Date: 2026-04-24

## Purpose

Define the first agent-facing `/memex:*` command set for the agent-native workflow.

Slash commands should be thin entry points. They should activate the skill workflow and pass user intent, not duplicate the full workflow instructions.

## Command Set

### `/memex:capture`

Intent:

Collect source material into the memex raw layer.

Inputs:

```text
/memex:capture <url|file|text|query>
```

Behavior:

- Detect whether the input is a URL, local file, pasted text, or keyword query.
- Prefer `memex fetch` for web URLs, sitemaps, and keyword queries.
- Store immutable source material under the appropriate `raw/` scene.
- Do not compile into wiki unless the user asks or the command includes an ingest option later.

### `/memex:ingest`

Intent:

Compile raw material into durable wiki pages.

Inputs:

```text
/memex:ingest [target]
```

Behavior:

- Inspect the vault and relevant raw files.
- Read existing index and related wiki pages.
- Create, merge, or update wiki pages based on meaning.
- Update `index.md` and `log.md`.
- Run or recommend lint after substantial edits.

### `/memex:query`

Intent:

Answer from the user's durable wiki.

Inputs:

```text
/memex:query <question>
```

Behavior:

- Use `memex search` to find candidate wiki pages when useful.
- Read relevant pages.
- Answer in conversation with markdown citations to wiki files.
- Do not write files unless the user explicitly asks to archive or save the answer.

### `/memex:distill`

Intent:

Convert an agent session or conversation into raw material for later ingest.

Inputs:

```text
/memex:distill [current|latest|path]
```

Behavior:

- Use `memex distill` when it can mechanically locate or parse sessions.
- Save output under `raw/<scene>/sessions/`.
- Ask whether to ingest immediately if the result contains durable lessons.
- Do not treat every conversation as worth ingesting.

### `/memex:repair`

Intent:

Run wiki health checks and repair safe issues.

Inputs:

```text
/memex:repair [--safe|--review]
```

Behavior:

- Run `memex lint` and `memex link-check` when available.
- Auto-fix mechanical issues that are clearly safe.
- Report semantic issues instead of silently rewriting meaning.
- Ask before large rewrites, deletion, or uncertain merges.

### `/memex:status`

Intent:

Show the current memex vault state.

Inputs:

```text
/memex:status
```

Behavior:

- Run `memex status`.
- Summarize vault location, page counts, raw counts, recent log activity, and health hints.
- Suggest the next likely command only when the state clearly implies one.

## Optional Future Commands

Do not implement these in the MVP unless needed:

- `/memex:onboard`
- `/memex:update`
- `/memex:archive`
- `/memex:link-check`
- `/memex:watch`
- `/memex:config`

These can remain CLI commands or advanced workflows until the core loop is validated.

## Command Design Rules

- Keep command prompts short.
- Do not copy entire skill references into command files.
- Prefer passing the user's raw argument to the skill.
- Avoid agent-specific behavior unless the agent requires it.
- Preserve compatibility with existing generated command locations.
- Use the same command names across agents when possible.

## Compatibility Notes

Different agents may implement commands differently:

- Claude Code can use slash command markdown files.
- Codex can use installed skills and command prompts.
- Cursor may use rules or command-like prompts.
- OpenCode and Gemini CLI may need generated instruction files.

The command contract should be identical even if the installation format differs.

## Acceptance Criteria

- Each generated slash command is thin and points to the same ai-memex workflow.
- Commands work without requiring the user to know raw CLI syntax.
- Existing users can still call CLI commands manually.
- Generated command names are stable enough to document publicly.

