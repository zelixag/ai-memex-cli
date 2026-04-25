# Skill MVP 规格

日期：2026-04-24

## 目的

创建第一版 `ai-memex` agent skill。这个 skill 应该让 agent 成为维护 LLM wiki 的主要入口，同时把现有 `memex` CLI 作为工具箱使用。

MVP 应该先证明 workflow 可行，再进行任何大的 CLI deprecation 或 README 重写。

## 触发意图

当用户提出以下需求时，skill 应该触发：

- 把资料加入 memex 或 LLM wiki
- 把 source ingest 到 `raw/` 和 `wiki/`
- 询问 “what do I know about X?”
- 查询已有 wiki 知识
- 把一次对话蒸馏成长期 notes
- repair 或 lint 一个 wiki
- 提到 Karpathy LLM wiki、agent memory、durable markdown knowledge 或 compounding knowledge

## 核心规则

保留 source truth，并让知识持续复利。

Agent 可以综合生成 wiki 页面，但不能模糊原始 source material、citations、contradictions 或 operation history。

## 目录目标

初始实现：

```text
templates/skills/ai-memex/
  SKILL.md
  references/
    vault-protocol.md
    capture-workflow.md
    ingest-workflow.md
    query-workflow.md
    distill-workflow.md
    repair-workflow.md
    safety-rules.md
```

这个路径是源模板，后续可以由 `memex init`、`memex onboard` 或 `memex update` 安装到用户的 agent 环境。

## SKILL.md 职责

`SKILL.md` 应该保持紧凑，不应该复制每个 schema 细节。

它应该包含：

- 一句话说明 skill 目的
- core rule
- workflow selector
- 简短 operation checklists
- 何时调用 CLI commands
- 何时加载每个 reference file
- safety gates
- pre-delivery checklist

它不应该包含：

- 完整 README 内容
- 长篇 comparison sections
- 详细 implementation history
- 穷尽式 multi-agent installation instructions
- 应该放进 references 的大型示例

## References

### `vault-protocol.md`

定义：

- vault root discovery
- `raw/` 语义
- `wiki/` 语义
- `index.md`
- `log.md`
- `AGENTS.md`
- page types 和 frontmatter
- citation rules

加载时机：

- 手动初始化新 vault
- 写入或更新 wiki 文件
- 判断文件路径是否合法

### `capture-workflow.md`

定义：

- URL capture
- keyword capture
- pasted text capture
- file capture
- 何时使用 `memex fetch`
- raw file naming
- source metadata

加载时机：

- 用户提供 URL、文件或 source text
- 用户要求收集 research material

### `ingest-workflow.md`

定义：

- 如何读取 raw sources
- 如何选择 create vs merge vs update
- source attribution
- contradiction handling
- index 和 log 更新
- cascade updates

加载时机：

- 把 raw material 转成 wiki pages
- 更新已有 knowledge pages

### `query-workflow.md`

定义：

- 如何使用 `memex search`
- 如何读取相关 wiki pages
- 如何带 citation 回答
- 什么时候不写文件
- 什么时候 archive 一个 answer

加载时机：

- 用户询问 wiki 知道什么
- 用户要求基于已有知识做 synthesis

### `distill-workflow.md`

定义：

- 如何蒸馏当前或过去的 agent sessions
- 何时使用 `memex distill`
- 什么内容应该放进 `raw/<scene>/sessions/`
- 何时 ingest distilled sessions

加载时机：

- 用户要求保存一次对话
- 用户要求捕捉 lessons learned
- 用户要求把 debug 或 planning work 转成 wiki material

### `repair-workflow.md`

定义：

- 如何消费 `memex lint` 和 `memex link-check`
- safe auto-fixes
- 只报告不自动修复的 findings
- 何时在编辑前询问用户

加载时机：

- 用户要求 lint、repair、clean up 或 health-check wiki

### `safety-rules.md`

定义：

- raw immutability rules
- destructive edit gates
- source citation requirements
- ambiguous merge handling
- token-cost controls
- 哪些事情永远不能静默自动化

加载时机：

- workflow 可能覆盖、删除、合并或重写已有知识

## Workflow Selector

| User intent | Workflow |
| --- | --- |
| "save this URL" | Capture |
| "ingest this" | Capture if needed, then Ingest |
| "what do I know about X?" | Query |
| "save this conversation" | Distill |
| "fix my wiki" | Repair |
| "show vault health" | Status via CLI |

## CLI 使用策略

Skill 可以调用：

- `memex status`：在较大工作开始前查看状态
- `memex fetch`：用于 URL、sitemap 或 keyword capture
- `memex search`：缩小 query candidate 范围
- `memex lint`：repair 前使用
- `memex link-check`：link health 相关时使用
- `memex distill`：机械 session parsing 有用时使用

Skill 应避免调用：

- 自动化的 `watch --daemon --heal`，除非用户明确要求
- 宽泛的 update/install commands，除非用户正在修改 setup
- 未确认就覆盖生成的 agent instructions 的命令

## Safety Gates

执行以下操作前询问用户：

- 删除 wiki 或 raw files
- 重写大段已有 wiki sections
- 在匹配不确定时合并两个页面
- 自动修复事实矛盾
- 启用后台自动化
- 修改 vault 外部的 agent configuration files

执行以下操作前不需要询问：

- 读取文件
- 运行 status/search/lint
- 从用户提供的 material 创建新的 raw source file
- 为刚执行的操作追加 log entry

## MVP 验收标准

- `SKILL.md` 少于 500 行。
- Skill 可以引导 capture、ingest、query、distill 和 repair。
- Skill 渐进式加载 references。
- Skill 不要求用户知道 CLI command details。
- Skill 保留当前架构规则：CLI 不直接调用 LLM API。
- Skill 至少可以在 Claude Code 和 Codex 内手动测试。
