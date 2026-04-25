# Slash Command 规格

日期：2026-04-24

## 目的

定义第一版面向 agent 的 `/memex:*` 命令集，用于 agent-native 工作流。

Slash commands 应该是轻量入口。它们应该激活 skill workflow 并传递用户意图，而不是复制完整 workflow instructions。

## Command Set

### `/memex:capture`

意图：

把 source material 收集到 memex raw layer。

输入：

```text
/memex:capture <url|file|text|query>
```

行为：

- 检测输入是 URL、本地文件、粘贴文本还是 keyword query。
- 对 web URL、sitemap 和 keyword query 优先使用 `memex fetch`。
- 把不可变 source material 存到合适的 `raw/` scene 下。
- 除非用户要求，或后续命令包含 ingest 选项，否则不要编译进 wiki。

### `/memex:ingest`

意图：

把 raw material 编译成可持久维护的 wiki pages。

输入：

```text
/memex:ingest [target]
```

行为：

- 检查 vault 和相关 raw files。
- 读取已有 index 和相关 wiki pages。
- 根据语义创建、合并或更新 wiki pages。
- 更新 `index.md` 和 `log.md`。
- 在较大编辑后运行或建议运行 lint。

### `/memex:query`

意图：

从用户的 durable wiki 中回答问题。

输入：

```text
/memex:query <question>
```

行为：

- 有用时使用 `memex search` 找候选 wiki pages。
- 读取相关 pages。
- 在对话中回答，并提供指向 wiki files 的 markdown citations。
- 除非用户明确要求 archive 或 save answer，否则不要写文件。

### `/memex:distill`

意图：

把 agent session 或 conversation 转成供后续 ingest 的 raw material。

输入：

```text
/memex:distill [current|latest|path]
```

行为：

- 当 `memex distill` 可以机械定位或解析 sessions 时使用它。
- 将输出保存到 `raw/<scene>/sessions/`。
- 如果结果包含长期有价值的 lessons，询问是否立即 ingest。
- 不要把每次对话都默认视为值得 ingest。

### `/memex:repair`

意图：

运行 wiki health checks 并修复安全的问题。

输入：

```text
/memex:repair [--safe|--review]
```

行为：

- 可用时运行 `memex lint` 和 `memex link-check`。
- 自动修复明确安全的机械问题。
- 对语义问题进行报告，而不是静默重写含义。
- 在大规模重写、删除或不确定合并前询问用户。

### `/memex:status`

意图：

展示当前 memex vault 状态。

输入：

```text
/memex:status
```

行为：

- 运行 `memex status`。
- 汇总 vault location、page counts、raw counts、recent log activity 和 health hints。
- 只有当状态明确指向下一步时，才建议下一个可能命令。

## 可选未来命令

MVP 阶段除非必要，不实现这些命令：

- `/memex:onboard`
- `/memex:update`
- `/memex:archive`
- `/memex:link-check`
- `/memex:watch`
- `/memex:config`

这些可以继续作为 CLI commands 或 advanced workflows，直到核心闭环被验证。

## 命令设计规则

- command prompts 保持简短。
- 不要把完整 skill references 复制到 command files。
- 优先把用户原始参数传给 skill。
- 除非 agent 机制要求，否则避免 agent-specific behavior。
- 保持与现有生成命令位置的兼容。
- 尽量跨 agent 使用相同 command names。

## 兼容说明

不同 agent 可能用不同方式实现 commands：

- Claude Code 可以使用 slash command markdown files。
- Codex 可以使用 installed skills 和 command prompts。
- Cursor 可以使用 rules 或类似 command 的 prompts。
- OpenCode 和 Gemini CLI 可能需要生成 instruction files。

即便安装格式不同，command contract 也应该一致。

## 验收标准

- 每个生成的 slash command 都是轻量的，并指向同一个 ai-memex workflow。
- Commands 可以工作，不要求用户知道原始 CLI syntax。
- 现有用户仍然可以手动调用 CLI commands。
- 生成的 command names 足够稳定，可以公开写入文档。

