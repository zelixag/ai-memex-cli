---
title: "ai-memex-cli 项目知识草稿"
source-type: code-reading
repo: ai-memex-cli
branch: main
commit: ee1d2fa
generated: 2026-04-25
scope:
  - src/
  - templates/
  - tests/
  - design/
  - website/
notes:
  - "基于当前代码阅读生成，不复制整仓源码。"
  - "代码仓库仍是实时 source of truth；本文件只沉淀可复用项目理解。"
---

# ai-memex-cli 项目知识草稿

## 草稿边界

这是一份 code-reading source，可以后续作为 raw/source 被 `memex ingest` 编译进项目 wiki。它不是源码镜像，不保存整仓代码；需要验证细节时，agent 应实时读取当前 repo 文件。

扫描时的仓库状态：

- 分支：`main`
- HEAD：`ee1d2fa`
- 工作区存在未提交修改：`.claude/skills/release/scripts/04-build-all.mjs`、`CHANGELOG.md`
- 本次阅读覆盖 CLI 源码、核心模块、skill/templates、设计文档、测试分布和 website 文档站入口

## 项目定位

`ai-memex-cli` 是一个 agent-first 的 LLM wiki / AI memex 工具。用户日常不应该直接围着 CLI 操作知识库，而是在 Claude Code、Codex、Cursor、OpenCode、Gemini CLI 等 agent 对话中用 `/memex:*` 或 `ai-memex` skill 触发工作流。

核心定位：

- Agent 是语义工作流入口：判断何时 capture、ingest、query、distill、repair。
- CLI 是确定性工具箱：初始化、抓取 source、搜索、lint、link-check、session 解析、安装 agent commands/skills。
- Vault 是 Git-backed Markdown 知识库：`raw/` 保存不可变来源，`wiki/` 保存 agent 维护的结构化知识，`index.md` 和 `log.md` 提供导航和历史。
- CLI 不直接调用 LLM API，也不自行写 wiki 的语义内容；语义判断由外部 agent 完成。

主要证据路径：

- `README.zh-CN.md`：当前对外定位已经改为“AI Agent 的长期记忆”和 agent-first 工作流。
- `design/agent-native-architecture.zh-CN.md`：三层架构为 Agent Interface、Workflow Protocol、CLI Toolbox。
- `templates/skills/ai-memex/SKILL.md`：skill 明确要求保存 source truth，并把 CLI 当作 deterministic toolbox。

## 当前代码地图

### CLI 入口层

- `src/cli.ts` 是唯一 CLI 注册入口，使用 `cac('memex')` 注册所有命令。
- 命令分组清晰：onboarding、vault management、configuration、content acquisition、knowledge processing、wiki operations、context injection、agent integration、self-update。
- `src/cli-parse-guard.ts` 负责更友好的命令解析错误。
- `src/version.ts` 从 package metadata 读取版本。

已注册命令：

- setup/config：`onboard`、`init`、`status`、`config`、`update`
- source/raw：`fetch`、`distill`
- wiki maintenance：`ingest`、`watch`、`new`、`log`、`search`、`lint`、`link-check`
- context：`glob`、`inject`、`install-hooks`、`context`

### 命令实现层

`src/commands/*` 是命令 orchestration 层。大部分命令做参数归一化、vault/agent 解析、prompt 构建或调用 core 函数，不承担复杂语义判断。

关键命令边界：

- `onboard.ts`：交互式向导，选择多个 agent，记录每个支持 agent 的 sessionDir，初始化默认 vault，安装 slash commands/skills，并可写入 L0 context block。
- `install-hooks.ts`：生成不同 agent 的 `/memex:*` prompt/command 文件和 `ai-memex` skill。Claude Code 使用 `.claude/commands/memex/*.md`；Codex 使用 `~/.codex/prompts/memex/*.md`；Cursor 使用 rules；其他 agent 使用各自约定。
- `context.ts`：把 marker-delimited L0 bootstrap block 写入 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 或 `.cursor/rules/memex.mdc`，并维护 `~/.llmwiki/contexts.json` 注册表。
- `fetch.ts`：URL、关键词搜索、sitemap/crawl、agent delegated fetch 都落到 vault `raw/<scene>/`。
- `distill.ts`：默认无参时从当前/配置 agent 的 session 目录找到最新会话，解析为结构化 Markdown 写到 `raw/<scene>/sessions/`，不复制原始 JSONL。
- `ingest.ts`：构建 agent prompt，让 agent 读取 raw、wiki schema、index 并写 wiki 页面；CLI 本身只编排，不判断语义。
- `watch.ts`：raw 文件变化后触发 `ingest -> lint -> ingest` 循环，可 daemon，可 heal，但属于高级自动化。
- `lint.ts` / `link-check.ts`：机械健康检查，基于 frontmatter、wikilinks、孤儿页、断链。
- `search.ts`：本地搜索 wiki/raw，支持 ripgrep、qmd、hybrid，并支持中文查询测试。

### 核心模块层

`src/core/*` 提供可测试的 deterministic primitives：

- `agent-adapter.ts`：agent registry、agent CLI 调用方式、context 文件名、sessionDir/sessionPattern、Windows 命令行长度规避和 prompt temp file fallback。
- `vault.ts`：vault 解析策略，优先显式 `--vault`，然后 upward local/global 检测，再 fallback 到 `~/.llmwiki`。
- `config.ts`：合并默认配置、全局 `~/.llmwiki/config.json` 和 vault-local config；支持 `agents` 与 `sessionDirs`。
- `schema.ts`：frontmatter 解析、序列化、必填字段校验；当前 page types 为 `entity`、`concept`、`source`、`summary`。
- `wiki-index.ts`：遍历 Markdown wiki，解析 frontmatter 和 `[[wikilink]]`。
- `linker.ts`：孤儿页、断链、缺失 frontmatter 检查。
- `searcher.ts` / `fetcher.ts`：DuckDuckGo Lite 搜索、HTML fetch、Readability + Turndown 转 Markdown、sitemap/crawl。
- `distiller.ts`：JSONL/JSON/plain text session 解析为结构化 Markdown。
- `context-block.ts` / `context-registry.ts`：生成、splice、remove L0 context block，并记录已安装项目。
- `ingest-lint-loop.ts`：自愈循环，把 lint report 作为下一轮 ingest prompt 的高优先级反馈。

### 工具层

- `src/utils/fs.ts`：路径 normalize、`~` 展开、Markdown 文件遍历、读写/追加文件。
- `src/utils/exec.ts`：命令执行、streaming 执行、stderr 解码、命令存在性检测。
- `src/utils/logger.ts` / `src/utils/progress.ts`：CLI 输出和进度条。

### 模板与 skill

- `templates/AGENTS.md` 定义默认 vault schema、scene/type、ingest/query/lint 约定。
- `templates/{entity,concept,source,summary}.md` 是 wiki 页面模板。
- `templates/skills/ai-memex/SKILL.md` 是安装到 agent 的 skill 源模板。
- `templates/skills/ai-memex/references/*` 把 capture、ingest、query、distill、repair、vault protocol、安全规则拆成 reference docs，符合 progressive disclosure。

### 网站文档站

- `website/` 是独立 Vite + React 文档站。
- `website/client/src/App.tsx` 使用 `wouter` 提供首页和 `/scenarios/:slug` 路由。
- `website/client/src/pages/Home.tsx` 组合 Hero、Features、Scenarios、Architecture、Commands、Comparison、QuickStart。
- `website/client/src/i18n/{zh-CN,en-US}.ts` 是中英文文案主数据源。
- `website/vite.config.ts` 使用 React、Tailwind Vite plugin、Manus runtime/debug collector，并支持 GitHub Pages base。

## 项目知识来源模型

长期维护项目时，不应该把整个代码库复制进 `raw/`。

推荐模型：

- 当前代码：agent 按任务实时读取最新文件，并在 wiki 里引用路径、模块、commit，不复制源码全文。
- 项目文档：README、design docs、ADR、release notes 可以作为 source material capture 或摘要。
- 协作材料：issue、PR、用户反馈、roadmap 讨论可以进入 raw/source。
- 会话沉淀：重要 debug、设计讨论、产品定位调整和下一步计划通过 `distill` 进入 `raw/<scene>/sessions/`。
- code-reading notes：像本文件这样的“带路径和 commit 的代码阅读观察”可以作为 raw/source 被 ingest。

wiki 里应维护的是稳定理解：

- `architecture-decisions`：为什么采用 agent-first、CLI toolbox、无 LLM API、无 MCP 绑定。
- `code-map`：入口、模块关系、命令边界、测试位置；引用路径，不复制代码。
- `command-design`：每个命令的输入、输出、调用关系和边界。
- `testing-contracts`：新增/修改命令时必须保护的行为。
- `known-pitfalls`：Windows 路径、cmd argv 长度、agent binary 不存在、watch daemon token 消耗、context block side effect。
- `user-feedback-roadmap`：用户反馈如何改变 README、website、onboard、多 agent 支持。

## 关键架构决策草稿

### 1. Agent-first，而不是 CLI-first

当前设计已经把日常入口从 CLI 命令迁移到 agent skill/slash prompts。CLI 命令仍保留，但主要承担底层机械动作。

落地证据：

- README 明确“日常使用发生在 agent 里”。
- `templates/skills/ai-memex/SKILL.md` 是 workflow selector。
- `install-hooks.ts` 生成 `/memex:capture`、`/memex:ingest`、`/memex:query`、`/memex:distill`、`/memex:repair` 等 prompt 入口。

### 2. CLI 不负责语义写作

`ingest.ts` 和设计文档反复强调：CLI 构建 prompt 并调用 agent，agent 负责读 raw/wiki、创建或更新 wiki 页面、更新 index/log。CLI 只做路径、搜索、frontmatter/link 校验、session 解析、安装配置等 deterministic work。

### 3. raw 是 source material，不是代码仓库镜像

`fetch` 把网页或搜索结果写入 raw；`distill` 把会话解析为 raw session Markdown；项目代码仍由 agent 在任务中实时读。项目知识应以 code-reading note 或 wiki page 的形式引用路径和 commit，而不是把源码复制进 raw。

### 4. 多 agent 支持通过 workflow protocol 统一

`agent-adapter.ts` 把不同 agent 的 binary、promptMode、contextFile、sessionDir/sessionPattern 统一成 profile。`install-hooks.ts` 和 `context.ts` 根据 agent 差异生成不同宿主文件，但 `/memex:*` 用户行为应一致。

### 5. L0 context 是可选 bootstrap，不是核心 wiki pattern

`context.ts` 可以把 vault digest 写入项目根 agent 文件，让新会话知道 vault 位置和摘要；但设计文档把它归为 agent-memory / advanced integration，不应替代核心 raw -> wiki -> query 闭环。

### 6. watch/heal 是高级自动化，需要谨慎

`ingest-lint-loop.ts` 支持 ingest/lint 自愈循环，并有 no-change guard、max-iter、stopSignal、force 等保护。README 也强调 `watch --daemon --heal` 会自主消耗 agent token，应先前台验证。

## 当前测试契约

测试框架：Vitest，Node environment，globals enabled。

已覆盖较好的区域：

- 路径/文件工具：`tests/utils/fs.test.ts`
- 命令执行工具 stderr 解码：`tests/utils/exec.test.ts`
- agent profiles、schema 文件映射、prompt spill-to-file：`tests/core/agent-adapter.test.ts`
- vault resolution：`tests/core/vault.test.ts`
- config fallback：`tests/core/config.test.ts`
- frontmatter parsing/validation：`tests/core/schema.test.ts`
- wiki index、wikilinks：`tests/core/wiki-index.test.ts`
- linker/lint：`tests/core/linker.test.ts`、`tests/commands/lint.test.ts`
- search including raw/wiki and Chinese query：`tests/commands/search.test.ts`
- fetch dry-run and URL/keyword detection：`tests/commands/fetch.test.ts`
- init/new/log/status/config/install-hooks commands：`tests/commands/*.test.ts`
- ingest-lint-loop convergence/no-change/force/stopSignal/reporter behavior：`tests/core/ingest-lint-loop.test.ts`

明显需要补强的区域：

- `contextCommand` install/refresh/uninstall/status 的测试。
- `onboardCommand` 多 agent interactive 流程测试，尤其 `sessionDirs` 写入和 user/project install 分支。
- `distillCommand` 当前 agent 推断、最新 session 选择、no-arg default 行为的端到端测试。
- `watchCommand` daemon/status/follow/stop 测试。
- `updateCommand` 更新源选择测试。
- website 没有专门的组件或路由测试，目前主要靠 `npm run check` 和 build。

## 风险与坑位

### Windows 路径与命令长度

项目需要持续保护 Windows 兼容性：

- `normalizePath()` 统一正斜杠。
- agent prompt 过长时 `prepareAgentPromptArgs()` 会把 prompt 写入 temp Markdown，避免 Windows cmd.exe 参数长度限制。
- tests 已覆盖部分路径和 prompt spill 行为。

### Agent binary 不可用时必须降级

`ingest`、`distill` 会在 agent 找不到时打印支持 agent 列表和配置提示，而不是 panic。后续新增 agent 或改 promptMode 时必须保持这个降级体验。

### `ingest` 的 target 语义容易误导

`ingest.ts` prompt 允许 agent 读取 text-based source code 文件，这对“把某个 code-reading source ingest 进 wiki”有用，但文档层必须澄清：项目知识不等于把整仓源码复制进 raw，也不等于把源码全文编译成 wiki。项目 wiki 应保存路径化理解和长期决策。

### Context block 有项目文件副作用

`context install/refresh` 会改写 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 或 Cursor rules 中的 marker block，并更新 `~/.llmwiki/contexts.json`。它应保持幂等，并只替换 marker 内内容。

### Watch/heal 可能消耗 token

`watch --daemon --heal` 会周期性触发 agent 修复。默认 UX 不应引导新用户先开 daemon，应该先从手动 `/memex:ingest`、`/memex:repair` 或 `watch --once` 开始。

### Website build warning

最近构建能通过，但 Vite build 仍会提示 analytics env placeholder 未定义和 chunk size 大于 500 kB。它们不是当前核心 CLI 失败，但适合在 website 发布前处理或明确忽略。

## 建议落地的 wiki 页面

后续 ingest 本文件时，建议生成或更新以下页面：

- `wiki/team/summaries/ai-memex-cli-overview.md`
  - 项目定位、用户入口、核心闭环、与 RAG/MCP/CLI-only 工具的边界。
- `wiki/team/summaries/ai-memex-cli-code-map.md`
  - `src/cli.ts`、`src/commands/*`、`src/core/*`、`templates/*`、`tests/*`、`website/*` 的结构导航。
- `wiki/team/concepts/agent-first-memex-workflow.md`
  - agent skill 是主界面，CLI 是工具箱的产品与架构原则。
- `wiki/team/concepts/cli-toolbox-boundary.md`
  - CLI 不写语义内容、不调 LLM API、只做机械原语的边界。
- `wiki/team/concepts/session-distillation.md`
  - no-arg distill、sessionDirs、多 agent session source 的机制。
- `wiki/team/concepts/multi-agent-installation.md`
  - agent profiles、slash prompts、skills、context files、user/project scope。
- `wiki/team/summaries/testing-contracts.md`
  - 当前测试保护范围、缺口和新增命令时的回归要求。
- `wiki/team/summaries/known-pitfalls.md`
  - Windows、agent fallback、context side effects、watch/heal token 消耗。

## 建议下一步 ingest prompt

在 agent 对话中使用：

```text
/memex:ingest dev-notes/2026-04-25-project-knowledge-draft.md
```

ingest 时的要求：

- 不要复制本仓源码全文。
- 只把稳定的架构、模块地图、命令边界、测试契约和风险点写入 wiki。
- 每个新页面都应在 `sources:` 中引用本 code-reading source，并在正文中保留关键代码路径。
- 更新 `index.md` 和 `log.md`。
- 大范围合并或删除已有 wiki 页面前先询问用户。
