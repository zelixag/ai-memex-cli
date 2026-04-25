# Changelog

本文件由 [changelogen](https://github.com/unjs/changelogen) 根据 [Conventional Commits](https://www.conventionalcommits.org/) 生成。发版前执行 `pnpm release`（或 `release:minor` / `release:major`）会递增版本、更新本文件并创建 git 提交与标签。

**首次增量发版前（只需一次）**：在当前基线提交上打标签，之后新版本只会统计该标签之后的提交：`git tag v0.1.0` 并 `git push origin v0.1.0`（若尚未打过 `v0.1.0`）。

## v0.3.0

### 🚀 Enhancements

- **Agent-native architecture (Phase 3-5)**：CLI 完全转向"机械层"定位，所有语义工作交给外部 agent，新增 `memex onboard` / `memex context` 命令族用于 L0 上下文注入。([6ad427c](https://github.com/zelixag/ai-memex-cli/commit/6ad427c))
- **Vault 结构重构**：`global vault` 概念改为 `default wiki vault`（`~/.llmwiki/`），`init` 命令支持 `--agent` 标志指定 wiki schema 文件名，context 命令支持绑定 wiki 场景。([ee1d2fa](https://github.com/zelixag/ai-memex-cli/commit/ee1d2fa))
- **国际化与文档站升级**：website 新增 ScenariosSection / ScenarioArticle，HeroSection / Navbar / ThemeContext 重新设计，i18n 文案大幅扩充（en-US.ts +424 行 / zh-CN.ts +428 行），新增暗色主题与场景介绍页。([be5790c](https://github.com/zelixag/ai-memex-cli/commit/be5790c), [ee1d2fa](https://github.com/zelixag/ai-memex-cli/commit/ee1d2fa))

### 📦 Release tooling & Docs

- **新增 release skill（`.claude/skills/release/`）**：替代旧的 `scripts/release.mjs`，把发版流程拆成 11 个独立可调用的阶段脚本（preflight / sync-docs / bump / build / test / pack-preview / git-finalize / publish / git-push / github-release / verify），由 `orchestrator.mjs` 串联，`pnpm release` 入口指向新 orchestrator。每阶段输出 `::summary:: <json>` 供 agent 解析。([ee1d2fa](https://github.com/zelixag/ai-memex-cli/commit/ee1d2fa))
- **新增 beta 通道支持**：`pnpm release --beta` 走 `--tag beta` 发 npm，打 `vX.Y.Z-beta.N` git tag，自动跳过 GitHub Release，避免 prerelease 污染 release feed。
- **新增 GitHub Release 自动化**：phase 10 自动从 CHANGELOG.md 切片 `## vX.Y.Z` 段，喂给 `gh release create --notes-file`。
- **新增 `pnpm pack --dry-run` 内容审计**：phase 6 校验 tarball 必含 `dist/` `templates/` `README*.md` `CHANGELOG.md` `LICENSE`，且不带 `.claude/` `.codex/` `website/` `tests/` `scripts/` 等私有目录。
- **新增发布后验证**：phase 11 校验 `pnpm view <pkg>@<version> version` 与 `gh release view` 都符合预期。
- 删除旧 `scripts/release.mjs`（功能已迁入 skill）。([ee1d2fa](https://github.com/zelixag/ai-memex-cli/commit/ee1d2fa))
- 文档同步脚本 (`docs:sync`) 与构建脚本完善。([2ed27b2](https://github.com/zelixag/ai-memex-cli/commit/2ed27b2), [70977c9](https://github.com/zelixag/ai-memex-cli/commit/70977c9))

### 🩹 Fixes

- **Phase 4 / 5 Windows libuv `process_title` assertion (STATUS_STACK_BUFFER_OVERRUN)**：CLI build 改为直接 `node node_modules/typescript/bin/tsc`、tests 改为 `node vitest.mjs run --pool=threads`，砍掉 corepack/pnpm 多层 spawn，规避 Windows + Node 22 的多层 child_process 触发的 libuv 崩溃。同时让 v0.1.5 已知的 4 个 Windows-only `search.test.ts` 失败一并复活。
- 中英文 README 重新对齐 vault 结构变更后的术语，删除过时段落。([ee1d2fa](https://github.com/zelixag/ai-memex-cli/commit/ee1d2fa))
- index.html 修正英文本地化，清理过时 docs 资源。([5bdcf88](https://github.com/zelixag/ai-memex-cli/commit/5bdcf88))

### 💅 Refactors

- AGENTS.md 精简，去除 23 行过时的 schema 说明。([ee1d2fa](https://github.com/zelixag/ai-memex-cli/commit/ee1d2fa))
- CLAUDE.md 项目说明更新，反映 vault 结构与命令变化。([ee1d2fa](https://github.com/zelixag/ai-memex-cli/commit/ee1d2fa))
- 清理过时 website 文件与配置。([7cf4245](https://github.com/zelixag/ai-memex-cli/commit/7cf4245))

### 🔧 Internal

- `.gitignore` 新增 `.claude/settings.local.json` 与 `.codex/`，让 `.claude/skills/` 进 git 但放过本地配置。

## v0.1.5

### 🚀 Enhancements

- `memex watch --daemon` 现在每轮把 **完整的 ingest 命令行 + prompt 头 40 行 + agent 实时 stdout/stderr** 打到 `.llmwiki/watch.log`，不再只有一条 "ingest complete" 摘要。
- `memex watch` 在 Windows 后台运行时不再为每次 ingest 弹出黑色 `claude` 控制台窗口（`runCommandStreamed` 加 `windowsHide: true`，只在必要时走 shell）。
- `runIngestLintLoop`（wiki 自愈循环核心）重构为可注入 `ingestFn` / `lintFn` / `skipContextRefresh`，生产默认行为零变化，首次具备可单元测试的控制流。

### 📦 Release tooling & Docs

- 新增 `scripts/release.mjs`：10 步自动化发版管线（preflight → agent 同步 docs → human review → version bump → build → rebuild docs/ → tests → git commit+tag → pnpm publish → 可选 push），支持 `--dry-run` / `--no-agent` / `--rebuild-docs` / `--no-rebuild-docs` 等开关；Windows 下通过 `resolvePnpmEntry()` 绕过 cmd.exe shim，规避 libuv `process_title` assertion。
- 新增 `CONTRIBUTING.md`：双语 maintainer 指南，涵盖发版流程、SemVer 规则、开发环境、Windows 注意事项。
- `README.md` 围绕 Karpathy 的 [LLM Wiki pattern] 重新叙事，强调"为 LLM agent 提供持久领域记忆"作为核心定位；新增 `README.zh-CN.md`（简体中文版）并做语言切换。
- 新增 `website/`：React + Vite 编写的文档站源码（之前仓库里只有 `docs/` 构建产物，现在源码入库，发布流程可自动重建）。

### 🧪 Tests

- 新增 `tests/core/ingest-lint-loop.test.ts`：12 条 TDD 行为契约覆盖——clean 收敛、脏仓库 heal、`lintReport` 跨轮透传、`maxIter` 上限、`no-change` 守卫、`--force` 绕过、`stopSignal` 中断、`skipFirstIngest`、reporter 事件序列、`maxIter=0 → ∞` 无限循环、`ingest` 抛错不破坏循环。

### 🩹 Fixes

- `runCommandStreamed` 在 Windows 上只对 `.cmd/.bat/.ps1` 启用 shell 解析，避免 detached daemon 对每个子进程新建控制台。

### 🪟 Known issues (Windows)

以下 7 个测试在 Windows 平台失败，**均为 pre-existing，不是 0.1.5 引入的 regression**，已记为 **v0.1.6 首要修复目标**：

- `tests/utils/fs.test.ts` × 3：断言期望值硬编码为 Unix 风格路径 / 反斜杠，与 `normalizePath` "始终返回 POSIX 正斜杠" 的契约不一致；需要修测试期望值。
- `tests/commands/search.test.ts` × 4：temp vault 下 `searchCommand` 返回 `No results`，怀疑是 glob pattern 在 `C:/Users/…` 路径上的匹配问题或 fixture helper 的平台差异，需要定位。

Unix 平台（macOS / Linux / CI）上述测试应为绿色。

## v0.1.3

### 🚀 Enhancements

- 新增 `memex context` 命令族（`install` / `refresh` / `uninstall` / `status`）：用幂等 HTML 注释标记把 vault 元信息 + 场景摘要写进项目根目录的 `CLAUDE.md` / `AGENTS.md` / `.cursor/rules/memex.mdc` 等；通过 `~/.llmwiki/contexts.json` 注册表支持跨项目批量刷新。这是 L0 上下文注入（会话启动即感知 wiki）的基础设施。([20aa15c](https://github.com/zelixag/ai-memex-cli/commit/20aa15c))
- `memex ingest` 接受可选 `lintReport` 参数，把 lint 结果作为高优先级修复指令拼进 prompt，驱动 agent 自愈。([20aa15c](https://github.com/zelixag/ai-memex-cli/commit/20aa15c))
- `memex watch` 正式支持自愈循环（`ingest → lint → ingest with report → …`）：`--daemon` 后台驻留、`--max-iter 0` 无限迭代（`∞`）、`--force` 绕过"无进展"守卫、`--heal` 按周期跑健康检查（`--heal-interval`，默认启动时先 lint 一次）、`-f/--follow` tail 日志、`--status` 读取实时快照（`.llmwiki/watch.status.json`）。([20aa15c](https://github.com/zelixag/ai-memex-cli/commit/20aa15c))
- `memex distill` 按场景存放会话（默认 `raw/team/sessions/`，`--scene` 可覆盖），结构化解析 Claude Code / OpenAI JSONL 为带 `source-type: session` frontmatter 的 Markdown，不再把 JSONL 拷进 vault。([9972305](https://github.com/zelixag/ai-memex-cli/commit/9972305))
- `memex distill` / `memex ingest` / `memex fetch` 全面加上进度指示（spinner + 批量转换进度条），长任务不再"卡着没反馈"。([9972305](https://github.com/zelixag/ai-memex-cli/commit/9972305))
- `memex onboard` 在 Step 4b 交互式询问是否安装 L0 上下文块；`memex install-hooks` 默认顺手装，可通过 `--no-context` / `--context-mode` 控制。([20aa15c](https://github.com/zelixag/ai-memex-cli/commit/20aa15c))

### 🩹 Fixes

- `memex init` 把会话目录从 `raw/sessions/` 校正到 `raw/team/sessions/`（与"team 场景"语义一致），ingest prompt 同步更新并保留对旧 `jsonl` 的向后兼容解析。([9972305](https://github.com/zelixag/ai-memex-cli/commit/9972305))

### 💅 Refactors

- `src/commands/distill.ts` 完全重写 `captureAllSessions` 为 `convertAllSessionsToMarkdown`：直接从 agent 源目录读 JSONL、结构化渲染成 Markdown，跳过中间拷贝。([9972305](https://github.com/zelixag/ai-memex-cli/commit/9972305))
- 新增 `src/core/context-block.ts` / `context-registry.ts` / `watch-status.ts` / `ingest-lint-loop.ts` / `prereqs.ts` 等核心模块。([20aa15c](https://github.com/zelixag/ai-memex-cli/commit/20aa15c))

## v0.1.1

### 🚀 Enhancements

- 新增发版工具链：`pnpm changelog` / `changelog:bump` / `release` / `release:minor` / `release:major` / `release:publish` 脚本（基于 [changelogen](https://github.com/unjs/changelogen)）。([48a5ad2](https://github.com/zelixag/ai-memex-cli/commit/48a5ad2))
- 运行时版本号改为 `src/version.ts` 动态读 `package.json`，`memex -v` 与 `memex update` 不再手抄版本号。([48a5ad2](https://github.com/zelixag/ai-memex-cli/commit/48a5ad2))

### 🏡 Chore

- 包版本 bump `0.1.0 → 0.1.1`。([48a5ad2](https://github.com/zelixag/ai-memex-cli/commit/48a5ad2))

## v0.1.0


### 🚀 Enhancements

- Initial implementation of memex CLI ([59b0386](https://github.com/zelixag/ai-memex-cli/commit/59b0386))
- Add `memex fetch` command with built-in crawler and agent mode ([c91eab2](https://github.com/zelixag/ai-memex-cli/commit/c91eab2))
- Install-hooks generates slash commands for all major agents ([1c30e25](https://github.com/zelixag/ai-memex-cli/commit/1c30e25))
- Memex onboard — interactive setup wizard ([916705d](https://github.com/zelixag/ai-memex-cli/commit/916705d))
- Memex update — self-update command ([323d7d3](https://github.com/zelixag/ai-memex-cli/commit/323d7d3))
- TDD overhaul — 84 tests, input validation for all commands, edge case fixes ([7b7b5d5](https://github.com/zelixag/ai-memex-cli/commit/7b7b5d5))
- Memex fetch supports keyword search — auto-detect URL vs keywords, DuckDuckGo search, interactive selection, agent search mode ([357282d](https://github.com/zelixag/ai-memex-cli/commit/357282d))
- Add React docs website source + rebuild GitHub Pages with React ([382f38c](https://github.com/zelixag/ai-memex-cli/commit/382f38c))

### 🩹 Fixes

- Search now covers raw/ + wiki/, guard empty query ([5b9f6e9](https://github.com/zelixag/ai-memex-cli/commit/5b9f6e9))
- Vault auto-detection when cwd is inside .llmwiki directory ([6384ba4](https://github.com/zelixag/ai-memex-cli/commit/6384ba4))
- Set base=/ai-memex-cli/ for GitHub Pages asset paths ([c5ad13a](https://github.com/zelixag/ai-memex-cli/commit/c5ad13a))
- Remove debug-collector script from production build ([f5bd9ea](https://github.com/zelixag/ai-memex-cli/commit/f5bd9ea))
- Use wouter Router base path to fix GitHub Pages routing ([fc6cd77](https://github.com/zelixag/ai-memex-cli/commit/fc6cd77))
- Update image CDN URLs to new cloudfront addresses ([9b48a6c](https://github.com/zelixag/ai-memex-cli/commit/9b48a6c))

### 💅 Refactors

- ⚠️  Complete rewrite — TypeScript/cac/stateless architecture ([078aa9c](https://github.com/zelixag/ai-memex-cli/commit/078aa9c))

### 📖 Documentation

- Rewrite README with competitive positioning, full command reference, and architecture overview ([250908a](https://github.com/zelixag/ai-memex-cli/commit/250908a))
- Update competitive analysis in README to include atomicmemory and ussumant llm-wiki-compiler implementations ([8f0b622](https://github.com/zelixag/ai-memex-cli/commit/8f0b622))
- Update README with all new commands (fetch keywords, onboard wizard, update, config) ([d100eb1](https://github.com/zelixag/ai-memex-cli/commit/d100eb1))
- Add GitHub Pages documentation website ([3a9dab7](https://github.com/zelixag/ai-memex-cli/commit/3a9dab7))
- Replace images with custom illustrations ([46c4faf](https://github.com/zelixag/ai-memex-cli/commit/46c4faf))
- Rebuild with Aether framework + zh/en i18n support ([72bc6f4](https://github.com/zelixag/ai-memex-cli/commit/72bc6f4))

### 🏡 Chore

- Rename project to ai-memex-cli ([e187381](https://github.com/zelixag/ai-memex-cli/commit/e187381))
- Add npm publish metadata (repository, homepage, files, author) ([7d95da5](https://github.com/zelixag/ai-memex-cli/commit/7d95da5))
- Clean up website files and update .gitignore ([48c82cf](https://github.com/zelixag/ai-memex-cli/commit/48c82cf))

#### ⚠️ Breaking Changes

- ⚠️  Complete rewrite — TypeScript/cac/stateless architecture ([078aa9c](https://github.com/zelixag/ai-memex-cli/commit/078aa9c))

### ❤️ Contributors

- Zhenglinxiong <zhenglinxiong@xmov.ai>
- Zelixag ([@zelixag](https://github.com/zelixag))

