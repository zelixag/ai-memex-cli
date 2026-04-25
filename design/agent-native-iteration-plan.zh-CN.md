# Agent-Native 迭代计划

日期：2026-04-24

## 决策

`ai-memex-cli` 应该从 CLI-first 产品转向 agent-native wiki 工作流。

CLI 仍然重要，但它不应该继续作为主要用户界面。主要入口应该是 agent skill 和 slash commands，用来引导用户的 AI assistant 完成 LLM wiki 工作流。

## 为什么要改

ai-memex 的核心价值不是让用户记住终端命令。它的价值是让 AI agent 维护一个可持久积累的 Markdown wiki，而不是每次对话都从原始资料重新推导知识。

这类工作本质上是语义性的：

- 判断一个 source 应该创建新概念，还是更新已有页面
- 带着出处合并互相矛盾的 source
- 更新交叉链接和 summary
- 把有价值的对话蒸馏回长期知识
- 在不破坏语义的前提下修复 wiki 健康问题

这些决策属于 agent 工作流，不属于确定性的 CLI。

CLI 应该用可靠的 primitive 支撑工作流：初始化文件、抓取 source、查看 vault 状态、搜索页面、校验链接，以及安装或刷新 agent instructions。

## 产品形态

目标产品是：

> AI Memex 是一个 agent-native 的 LLM wiki 工作流，由 CLI 工具箱提供底层支撑。

这更接近 OpenSpec，而不是普通终端工具：

- OpenSpec 用 CLI 安装和更新项目 artifacts。
- 用户随后在 agent 内通过 `/opsx:*` 命令工作。
- 仓库维护 protocol、artifact structure 和 assistant instructions。

ai-memex 应该采用同样的形态：

- `memex` 负责安装、更新、验证、抓取和搜索。
- Agent skill 负责 ingest、query、distill 和 repair 工作流。
- Slash commands 在 Claude Code、Codex、Cursor、OpenCode、Gemini CLI 等工具中暴露常用工作流。

## 用户体验目标

用户不应该需要记住命令图谱。

理想目标交互：

```text
/memex:capture https://example.com/paper
```

```text
/memex:ingest the OAuth notes I collected today
```

```text
/memex:query what do I know about agent memory tradeoffs?
```

```text
/memex:distill this debugging session into the team wiki
```

```text
/memex:repair run wiki health checks and fix safe issues
```

Agent 可以在底层调用 CLI primitives，但用户心智应该是：“我让 agent 维护我的 memex。”

## 边界

### CLI 职责

这些能力保留为确定性、可测试的 primitives：

- `memex init`：创建 vault 结构和初始 schema
- `memex onboard`：选择 agent、初始化 vault、安装命令
- `memex update`：刷新生成的 instructions、slash commands 和 templates
- `memex fetch`：把网页或文件 source 收集到 `raw/`
- `memex search`：搜索现有 wiki 内容
- `memex lint`：生成机器可读的 wiki 健康报告
- `memex link-check`：校验链接和引用
- `memex status`：汇总 vault 状态
- `memex config`：查看和修改 local/global 配置

这些命令应该避免语义创作。它们可以创建脚手架和报告，但不应该决定 wiki 的知识含义。

### Skill 职责

这些能力迁移为 agent skill 的一等工作流：

- 判断 source material 的含义
- 决定创建、合并还是更新 wiki 页面
- 保留 source attribution 和 contradictions
- 在语义变更后更新 index 和 log
- 基于 wiki 回答问题并提供 citation
- 判断哪些 lint findings 可以安全自动修复
- 把 sessions 蒸馏成 raw material，并在合适时 ingest
- 在知识维护存在歧义时引导用户决策

### Slash Command 职责

Slash commands 应该是进入 skill 的轻量入口，不应该复制全部 instructions。

第一版目标命令：

- `/memex:capture`
- `/memex:ingest`
- `/memex:query`
- `/memex:distill`
- `/memex:repair`
- `/memex:status`

## 本轮非目标

- 不立即删除现有 CLI 命令。
- 不引入 MCP server。
- 不让 CLI 直接调用 LLM provider APIs。
- 不把 `watch --heal` 作为默认工作流。
- 在新产品模型验证前不重写网站。
- 在第一版 skill 能跑真实 agent session 前，不创建大型框架。

## 成功标准

当以下条件满足时，本轮迭代成功：

- 用户可以安装或更新 ai-memex，然后主要在 agent 内操作。
- Skill 清晰解释如何维护 `raw/`、`wiki/`、`index.md`、`log.md` 和 `AGENTS.md`。
- CLI 被描述为工具箱，而不是主要工作流。
- 至少一个真实 vault 可以通过 agent commands 完成 `capture -> ingest -> query -> repair`。
- 现有 CLI tests 对确定性 primitives 仍然通过。

## 风险

- Skill 可能复制太多 CLI README，变得臃肿。
- 如果 slash commands 嵌入完整 workflow logic，可能和 skill 分叉。
- 如果文档仍然以 CLI-first quick start 呈现，用户会困惑。
- `ingest`、`distill`、`inject`、`watch` 等现有命令会模糊新边界。
- 如果第一版试图覆盖每个 agent 的特殊情况，multi-agent support 会让 skill 过宽。

## 风险控制

- 保持 `SKILL.md` 简短，把详细规则放进 `references/`。
- 把 slash commands 当作进入 skill 的 dispatcher，而不是独立文档。
- 迁移期间保持旧 CLI 命令可用。
- 先做出第一版 skill workflow，再更新 README 定位。
- 先验证 Claude Code 和 Codex，再扩展更多 agent-specific polish。

