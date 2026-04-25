# Design Documents

[简体中文](./README.zh-CN.md)

This directory contains source design documents for the agent-native ai-memex iteration.

These files are not generated website assets. They are working documents used to control product direction, architecture decisions, and migration tasks.

## Reading Order

1. [`agent-native-iteration-plan.md`](./agent-native-iteration-plan.md)
   - Chinese: [`agent-native-iteration-plan.zh-CN.md`](./agent-native-iteration-plan.zh-CN.md)
   - Product direction and iteration goals.
   - Defines the shift from CLI-first to agent-native.

2. [`agent-native-architecture.md`](./agent-native-architecture.md)
   - Chinese: [`agent-native-architecture.zh-CN.md`](./agent-native-architecture.zh-CN.md)
   - Three-layer architecture: agent interface, workflow protocol, CLI toolbox.
   - Classifies current commands by future ownership.

3. [`skill-mvp-spec.md`](./skill-mvp-spec.md)
   - Chinese: [`skill-mvp-spec.zh-CN.md`](./skill-mvp-spec.zh-CN.md)
   - Specification for the first `ai-memex` agent skill.
   - Defines trigger intent, reference files, safety gates, and acceptance criteria.

4. [`slash-command-spec.md`](./slash-command-spec.md)
   - Chinese: [`slash-command-spec.zh-CN.md`](./slash-command-spec.zh-CN.md)
   - First `/memex:*` command contract.
   - Keeps slash commands thin and skill-backed.

5. [`migration-tasks.md`](./migration-tasks.md)
   - Chinese: [`migration-tasks.zh-CN.md`](./migration-tasks.zh-CN.md)
   - Execution checklist for design, skill MVP, slash commands, CLI cleanup, docs, and validation.

## Current Direction

The active decision is:

> AI Memex is an agent-native LLM wiki workflow, powered by a CLI toolbox.

The CLI remains the deterministic support layer. The agent skill becomes the primary workflow interface.
