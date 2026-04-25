# Migration Tasks

Date: 2026-04-24

## Goal

Move ai-memex toward an agent-native workflow without breaking existing CLI users.

## Phase 0: Control Documents

- [x] Create product direction document.
- [x] Create architecture split document.
- [x] Create first skill specification.
- [x] Create slash command behavior spec.
- [ ] Create CLI command classification issue list.

Exit criteria:

- The team can explain which layer owns each behavior.
- Future code changes can cite a design document instead of relying on memory.

## Phase 1: Skill MVP

- [x] Create `templates/skills/ai-memex/SKILL.md`.
- [x] Create `templates/skills/ai-memex/references/vault-protocol.md`.
- [x] Create `templates/skills/ai-memex/references/capture-workflow.md`.
- [x] Create `templates/skills/ai-memex/references/ingest-workflow.md`.
- [x] Create `templates/skills/ai-memex/references/query-workflow.md`.
- [x] Create `templates/skills/ai-memex/references/distill-workflow.md`.
- [x] Create `templates/skills/ai-memex/references/repair-workflow.md`.
- [x] Create `templates/skills/ai-memex/references/safety-rules.md`.
- [ ] Test the skill manually on a small vault.

Exit criteria:

- A user can ask the agent to capture, ingest, query, distill, and repair without reading CLI docs.
- The skill calls existing CLI commands only where they add deterministic value.
- The skill has clear safety gates for destructive or ambiguous edits.

## Phase 2: Slash Command Refresh

- [x] Install `templates/skills/ai-memex` into `.claude/skills/ai-memex` for Claude Code via `install-hooks`.
- [x] Add explicit `install-hooks --scope project|user` support for Claude Code installs.
- [x] Expose project/user install scope during `memex onboard`.
- [x] Define Claude Code `/memex:capture`.
- [x] Define Claude Code `/memex:ingest`.
- [x] Define Claude Code `/memex:query`.
- [x] Define Claude Code `/memex:distill`.
- [x] Define Claude Code `/memex:repair`.
- [x] Define Claude Code `/memex:status`.
- [x] Update Claude Code `install-hooks` output to generate the new command set.
- [ ] Keep compatibility aliases for existing command names where needed.

Exit criteria:

- Slash commands are thin wrappers around the skill workflow.
- Generated commands do not duplicate large blocks of skill logic.
- Claude Code and Codex are validated first.

## Phase 3: CLI Boundary Cleanup

- [ ] Mark deterministic commands as core primitives in docs.
- [ ] Mark semantic orchestration commands as skill-backed workflows.
- [ ] Review `ingest` and decide whether it remains a command, becomes a dry-run prompt helper, or is documented as advanced.
- [ ] Review `distill` and split mechanical session parsing from semantic distillation.
- [ ] Review `inject` and decide whether it becomes an internal search/context helper.
- [ ] Review `watch --heal` and keep it advanced/off by default.
- [ ] Ensure every command has a clear owner layer.

Exit criteria:

- README no longer implies the CLI is the main way to use memex.
- Command help text reflects whether a command is a primitive or an agent workflow.
- No command silently performs semantic wiki authorship without agent involvement.

## Phase 4: Documentation Repositioning

- [ ] Rewrite README opening around agent-native workflow.
- [ ] Add quick start based on agent usage.
- [ ] Move CLI reference below the agent workflow.
- [ ] Update comparison section to position ai-memex against OpenSpec-style workflows and lightweight LLM wiki skills.
- [ ] Update Chinese README after English structure is stable.
- [ ] Update website copy after README settles.

Exit criteria:

- New users understand: install CLI, initialize, then work from the agent.
- Existing users can still find command references.
- The project name can remain `ai-memex-cli` temporarily while product copy shifts to `ai-memex`.

## Phase 5: Validation

- [ ] Run unit tests.
- [ ] Build the package.
- [ ] Run a sample `capture -> ingest -> query -> repair` flow in a test vault.
- [ ] Capture issues from real usage into `dev-notes/`.
- [ ] Decide whether any old commands should be deprecated in a later release.

Exit criteria:

- Deterministic CLI tests pass.
- The skill produces acceptable wiki edits in a real agent session.
- Migration risks are documented before public release.

## Open Questions

- How far should agent management go beyond `agent` + `agents[]` (for example enable/disable, per-agent scope, reinstall, remove)?
- Should the installable skill live inside this repo, or should it be published as a separate skill repo?
- Should `memex update` install both slash commands and skill files?
- Should `/memex:query` write archived answers by default only when explicitly asked?
- Should `raw/` remain immutable even for fetched content cleanup, or can the agent normalize formatting after capture?
- Should the first public release rename the product copy to `ai-memex` while keeping the npm package name unchanged?
