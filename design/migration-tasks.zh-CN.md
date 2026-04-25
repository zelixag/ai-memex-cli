# 迁移任务

日期：2026-04-24

## 目标

在不破坏现有 CLI 用户的前提下，把 ai-memex 推向 agent-native workflow。

## Phase 0：控制文档

- [x] 创建产品方向文档。
- [x] 创建架构分层文档。
- [x] 创建第一版 skill specification。
- [x] 创建 slash command behavior spec。
- [ ] 创建 CLI command classification issue list。

退出标准：

- 团队可以解释每个行为归属哪一层。
- 后续代码修改可以引用设计文档，而不是依赖记忆。

## Phase 1：Skill MVP

- [x] 创建 `templates/skills/ai-memex/SKILL.md`。
- [x] 创建 `templates/skills/ai-memex/references/vault-protocol.md`。
- [x] 创建 `templates/skills/ai-memex/references/capture-workflow.md`。
- [x] 创建 `templates/skills/ai-memex/references/ingest-workflow.md`。
- [x] 创建 `templates/skills/ai-memex/references/query-workflow.md`。
- [x] 创建 `templates/skills/ai-memex/references/distill-workflow.md`。
- [x] 创建 `templates/skills/ai-memex/references/repair-workflow.md`。
- [x] 创建 `templates/skills/ai-memex/references/safety-rules.md`。
- [ ] 在一个小型 vault 上手动测试 skill。

退出标准：

- 用户可以让 agent 完成 capture、ingest、query、distill 和 repair，而不需要阅读 CLI docs。
- Skill 只在能提供确定性价值时调用现有 CLI commands。
- Skill 对破坏性或含糊编辑有明确 safety gates。

## Phase 2：Slash Command 刷新

- [x] 通过 `install-hooks` 把 `templates/skills/ai-memex` 安装到 Claude Code 的 `.claude/skills/ai-memex`。
- [x] 为 Claude Code 安装增加显式 `install-hooks --scope project|user` 支持。
- [x] 在 `memex onboard` 中向用户暴露项目级/用户级安装范围选择。
- [x] 定义 Claude Code `/memex:capture`。
- [x] 定义 Claude Code `/memex:ingest`。
- [x] 定义 Claude Code `/memex:query`。
- [x] 定义 Claude Code `/memex:distill`。
- [x] 定义 Claude Code `/memex:repair`。
- [x] 定义 Claude Code `/memex:status`。
- [x] 更新 Claude Code `install-hooks` 输出，生成新 command set。
- [ ] 在需要时保留现有 command names 的 compatibility aliases。

退出标准：

- Slash commands 是 skill workflow 的轻量 wrapper。
- 生成的 commands 不复制大段 skill logic。
- 先验证 Claude Code 和 Codex。

## Phase 3：CLI 边界收敛

- [ ] 在文档中把确定性 commands 标记为 core primitives。
- [ ] 把语义编排 commands 标记为 skill-backed workflows。
- [ ] 审查 `ingest`，决定它是保留为 command、变成 dry-run prompt helper，还是记录为 advanced。
- [ ] 审查 `distill`，拆分 mechanical session parsing 和 semantic distillation。
- [ ] 审查 `inject`，决定它是否变成内部 search/context helper。
- [ ] 审查 `watch --heal`，保持 advanced/off by default。
- [ ] 确保每个 command 都有清晰的 owner layer。

退出标准：

- README 不再暗示 CLI 是使用 memex 的主要方式。
- Command help text 反映该命令是 primitive 还是 agent workflow。
- 没有命令在没有 agent 参与时静默执行 semantic wiki authorship。

## Phase 4：文档重新定位

- [ ] 围绕 agent-native workflow 重写 README 开头。
- [ ] 添加基于 agent usage 的 quick start。
- [ ] 把 CLI reference 移到 agent workflow 后面。
- [ ] 更新 comparison section，把 ai-memex 定位到 OpenSpec-style workflows 和轻量 LLM wiki skills 之间。
- [ ] 英文结构稳定后更新中文 README。
- [ ] README 稳定后更新 website copy。

退出标准：

- 新用户理解：安装 CLI、初始化，然后从 agent 中工作。
- 现有用户仍然可以找到 command references。
- 在 product copy 转向 `ai-memex` 时，项目名可以暂时保持 `ai-memex-cli`。

## Phase 5：验证

- [ ] 运行 unit tests。
- [ ] 构建 package。
- [ ] 在 test vault 上运行一次 `capture -> ingest -> query -> repair` 示例流程。
- [ ] 把真实使用中的问题记录到 `dev-notes/`。
- [ ] 决定后续版本是否 deprecate 某些旧 commands。

退出标准：

- 确定性 CLI tests 通过。
- Skill 在真实 agent session 中能产出可接受的 wiki edits。
- 公开发布前记录 migration risks。

## Open Questions

- agent 管理要做到什么程度，是否需要超过 `agent` + `agents[]`（例如启用/禁用、每 agent scope、重装、移除）？
- 可安装 skill 应该放在这个 repo 里，还是发布为单独 skill repo？
- `memex update` 是否应该同时安装 slash commands 和 skill files？
- `/memex:query` 是否只在用户明确要求时才写入 archived answers？
- `raw/` 是否必须保持 immutable，即使是 fetched content cleanup；或者 agent 可以在 capture 后规范化格式？
- 第一版公开发布是否应该把 product copy 改成 `ai-memex`，同时保持 npm package name 不变？
