# Agent-Native 架构

日期：2026-04-24

## 摘要

ai-memex 应该拆成三层：

```text
Agent Interface
  skill + slash commands

Workflow Protocol
  vault schema + wiki rules + operation contracts

CLI Toolbox
  deterministic commands and validation primitives
```

Agent Interface 是用户面对的工作流。CLI Toolbox 是实现支撑层。Workflow Protocol 是它们之间稳定的契约。

## 第一层：Agent Interface

这一层是用户日常工作时直接交互的入口。

Artifacts：

- `templates/skills/ai-memex/SKILL.md` 作为源模板，由 `memex init`、`memex onboard` 或 `memex update` 安装到用户的 agent 环境
- `/memex:ingest` 等 slash commands
- 面向 Claude Code、Codex、Cursor、OpenCode、Gemini CLI、Aider、Continue.dev 的 agent-specific command wrappers

职责：

- 解释用户意图
- 选择正确的 memex 工作流
- 在有用时调用 CLI primitives
- 通过 agent 的常规文件工具读写 wiki 文件
- 在存在歧义或破坏性变更前询问用户

Skill 应该是语义工作流的 source of truth。Slash commands 应该引用或触发同一个 workflow，而不是复制完整 instructions。

## 第二层：Workflow Protocol

这一层定义什么是有效的 memex workspace。

Artifacts：

- vault 目录结构
- wiki 页面模板
- frontmatter schemas
- index 和 log 约定
- raw source 约定
- lint report 格式
- capture、ingest、query、distill、repair 的操作契约

职责：

- 定义可持久维护的文件布局
- 定义 agent 可以和不可以修改什么
- 定义 citation 和 attribution 规则
- 定义 safe auto-fix 边界
- 保持 CLI 和 skill 行为一致

这一层应该独立于实现细节来记录。它让同一套工作流可以跨不同 agent 和命令系统存活。

## 第三层：CLI Toolbox

这一层执行确定性的工作。

Artifacts：

- `src/cli.ts`
- `src/commands/*`
- `src/core/*`
- `templates/*`
- tests

职责：

- 初始化 vault 和 config
- 抓取 source material
- 解析并校验 markdown/frontmatter
- 搜索本地 wiki 内容
- 报告 link 和 schema 问题
- 生成或刷新 agent-specific command files
- 查看 vault 状态

CLI 必须继续避免直接调用 LLM API，也不能自行创作语义 wiki 内容。

## 命令分类

### 保留为核心 CLI Primitives

这些命令适合做 CLI，因为它们是确定性或主要机械性的：

| Command | Role |
| --- | --- |
| `init` | 创建 vault 文件和初始 schema |
| `onboard` | 配置 agent、vault 和 hooks |
| `update` | 刷新生成的 memex artifacts |
| `fetch` | 收集 raw source material |
| `search` | 搜索现有 wiki 文件 |
| `lint` | 生成健康报告 |
| `link-check` | 校验 markdown links |
| `status` | 汇总 vault 状态 |
| `config` | 管理设置 |

### 重定位为 Skill Workflows

这些命令涉及语义工作流编排，应该逐步退居 skill 之后：

| Command | Future Role |
| --- | --- |
| `ingest` | Skill workflow，可调用 CLI helpers |
| `distill` | Skill workflow，CLI 提供解析支持 |
| `inject` | Query/context workflow，可能被 skill-guided search 替代 |
| `watch --heal` | 高级自动化，不是默认 UX |
| `context install` | 可选集成，不属于核心 Karpathy wiki pattern |
| `glob` | context selection 的内部 helper |

不要立即删除这些命令。先让 skill 路径变得更好，再决定 deprecate、rename，还是作为 advanced commands 保留。

## 第一版 Skill 形态

建议的 skill 结构：

```text
ai-memex/
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

`SKILL.md` 应该保持简短：

- skill 何时触发
- core rule：保留 source truth，让知识持续复利
- workflow selection table
- 每个 operation 的短 checklist
- 何时加载每个 reference 的说明

详细页面 schema 和示例属于 `references/`。

## 第一版 Slash Command Set

```text
/memex:capture <url|file|text|query>
/memex:ingest [target]
/memex:query <question>
/memex:distill [session|latest|current]
/memex:repair [--safe|--review]
/memex:status
```

每个命令应该：

- 表达用户意图
- 加载或激活 ai-memex skill
- 提供最小必要参数
- 避免嵌入完整 workflow rules

## 数据流

```text
User in agent
  -> /memex:capture
  -> skill decides capture mode
  -> CLI fetches source when useful
  -> raw/ receives immutable material

User in agent
  -> /memex:ingest
  -> skill reads raw/ + wiki/index.md + relevant pages
  -> agent writes semantic wiki updates
  -> skill updates index.md and log.md
  -> CLI lint validates mechanical health

User in agent
  -> /memex:query
  -> CLI search can narrow candidates
  -> skill reads wiki pages
  -> agent answers with citations
```

## 兼容策略

不要强迫所有 agent 在内部支持同一种机制。应该统一用户面对的行为。

Claude Code 可以使用 slash command。Codex 可以使用 installed skills 和 command prompts。Cursor 可以使用 rules 或 command-like prompts。即便安装路径不同，workflow protocol 也应该保持一致。

## 文档策略

按这个顺序更新文档：

1. 内部设计文档定义新模型。
2. Skill files 实现新模型。
3. Slash command docs 指向 skill。
4. README 从 CLI-first 改为 agent-first。
5. Workflow 稳定后再更新网站。
