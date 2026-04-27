# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`ai-memex-cli`（命令名 `memex`）是一个用于构建和维护持久化 LLM wiki 的 CLI 工具。它的核心定位是“机械层”：只做文件操作、frontmatter 校验、关键词匹配、链接检查等纯机械工作；所有语义决策（写什么内容、如何综合知识）都交给外部 LLM agent 通过 shell 调用来完成。

## 技术栈

- **运行时**：Node.js >= 20
- **语言**：TypeScript 5.4（严格模式 `strict: true`）
- **模块系统**：ES Modules（`"type": "module"`），内置模块导入需带 `node:` 前缀
- **CLI 框架**：`cac`
- **测试框架**：`vitest`（`globals: true`，`environment: 'node'`）
- **依赖库**：`gray-matter`、`chokidar`、`picocolors`
- **包管理器**：pnpm
- **构建工具**：`tsc` 直接编译，输出到 `dist/`

## 编码规范

- **文件命名**：命令文件使用 kebab-case（如 `link-check.ts`），模块文件使用 camelCase（如 `wiki-index.ts`）
- **导出约定**：每个命令文件导出 `*Command` 异步函数（如 `distillCommand`）；核心模块导出具体函数而非默认导出
- **类型命名**：接口/类型使用 PascalCase（如 `DistillOptions`、`WikiPage`）
- **导入顺序**：Node 内置模块（带 `node:` 前缀）→ 第三方依赖 → 项目内部模块
- **路径风格**：内部统一使用正斜杠（`/`），`normalizePath()` 处理 Windows 反斜杠
- **禁止项**：禁止引入与现有设计重复的大型框架

## 项目结构

```
src/
  cli.ts              # CLI 入口，使用 cac 注册所有命令
  commands/           # 各命令实现（init、distill、ingest、watch、glob、inject、lint、search、new、log、install-hooks、status、link-check）
  core/               # 核心领域逻辑（无 side effect 的纯函数优先）
    vault.ts          # Vault 路径解析
    config.ts         # 配置读写（~/.llmwiki/config.json）
    schema.ts         # Frontmatter 解析与校验
    wiki-index.ts     # Wiki 页面索引构建、[[link]] 提取
    globber.ts        # 关键词评分与页面筛选
    linker.ts         # 孤儿页、断链检测
    distiller.ts      # JSONL 解析与机械提取
    injector.ts       # @include 指令解析
  utils/
    fs.ts             # 文件系统封装（readFileUtf8、writeFileUtf8、listMarkdownFiles 等）
    exec.ts           # 子进程调用封装
    logger.ts         # 终端日志（info / success / warn / error）
templates/            # AGENTS.md 与 wiki 页面模板（concept、entity、source、summary）
tests/
  core/               # 核心模块单元测试
  fixtures/
    mock-vault/       # 完整 mock vault 结构，供测试使用
docs/                 # PRD 与设计文档
dist/                 # tsc 编译输出（.gitignore 忽略）
```

## Vault 目录规范

Vault 分两层：默认 wiki（`~/.llmwiki/`，旧版可能仍为 `~/.llmwiki/global/`）与 local（`<project>/.llmwiki/local/`）。所有路径在 CLI 内部统一归一化为正斜杠。

**默认 wiki vault 结构**
```
~/.llmwiki/
├── raw/                    # immutable 源文件（CLI 只读）
│   ├── personal/
│   ├── research/
│   ├── reading/
│   ├── team/
│   └── sessions/           # distill 产物
├── wiki/                   # agent 生成的 wiki 页（CLI 不修改语义内容）
│   └── <scene>/
│       ├── entities/       # 实体：人物、公司、工具、项目
│       ├── concepts/       # 概念：方法论、设计模式、技术栈
│       ├── sources/        # 源文档：文章、论文、网页、会话蒸馏
│       └── summaries/      # 合成页（comparison / overview / synthesis）
├── AGENTS.md               # wiki schema 定义
├── index.md                # wiki 目录（agent 更新）
└── log.md                  # append-only 时间线
```

**Local vault 结构**
```
<project>/.llmwiki/local/
├── wiki/                   # glob 投影的 global wiki 子集
└── AGENTS.md               # 项目级 schema，可包含 @include 指令
```

**Wiki 页面类型（frontmatter `type` 字段）**
| 类型 | 目录 | 说明 |
|------|------|------|
| `entity` | `entities/` | 实体页 |
| `concept` | `concepts/` | 概念页 |
| `source` | `sources/` | 源文档页 |
| `summary` | `summaries/` | 合成页，额外含 `subtype: comparison \| overview \| synthesis` |

**`@include` 语法（仅 local `AGENTS.md`）**
`memex inject` 解析以下行并拼接输出：
```markdown
## @include ../global/wiki/frontend-engineering-management.md
## @include ./wiki/*.md
```

## 命令调用关系与数据流

核心闭环（箭头表示数据/触发方向）：
```
SessionStart hook → glob → local wiki 物化
                          → inject (@include) → 上下文注入
                                            ↓
                                    对话中 agent 读 wiki / 更新 wiki
                                            ↓
SessionEnd hook   → distill → raw/sessions/session-*.md
                                            ↓
                          用户/定时  ingest → agent 更新 global wiki
                                            ↓
                          定期     lint → JSON 报告 → agent 修正
                                            ↓
                                    下次新会话（回到 glob）
```

| 命令 | 典型调用方 | 产出消费方 |
|------|-----------|-----------|
| `init` | 用户（一次性） | — |
| `distill` | SessionEnd hook | `ingest`（raw sessions） |
| `glob` | SessionStart hook | `inject`（local wiki） |
| `inject` | agent / SessionStart | agent 读拼接后的上下文 |
| `ingest` | user / watch / agent | agent 更新 wiki 页面 |
| `lint` | 周期 hook / user | agent 消费 JSON 报告后执行修正 |
| `watch` | daemon / user | 自动触发 `ingest` |

## 特殊约束

- **架构红线（必须遵守）**：
  1. CLI 永远不直接调用 LLM API，保持对所有 agent（Claude Code、Codex、Cursor、Windsurf 等）的中立。
  2. CLI 永远不自己写 wiki 页面的语义内容；它只负责机械正确性（文件操作、校验、搜索），语义正确性全部由外部 agent 负责。
  3. 与 agent 的交互统一通过 shell 命令（如 `claude -p`）完成，不引入 MCP 等特定生态绑定。
- **运行时约束**：ES Modules、`NodeNext` 模块解析、Node >= 20。
- **路径处理**：Vault 路径在内部统一归一化为正斜杠，Windows 兼容性通过 `normalizePath()` 保证。
- **配置降级**：当外部 agent 命令（如 `claude -p`）不可用时，必须提供友好的降级提示或纯机械 fallback，不能 panic。
- **MVP 验收**：新增或修改命令前，应核对 `docs/PRD-ai-memex.md` 第 7 章的验收标准（功能、鲁棒性、测试覆盖）。

<!-- memex:context:start v=1 vault=C:/Users/Administrator/.llmwiki mode=digest updated=2026-04-25 -->
## 🧠 Memex Knowledge Base

This project is connected to a persistent knowledge base (LLM Wiki) managed by the `memex` CLI.

- **Vault**: `C:/Users/Administrator/.llmwiki`
- **Pages**: 25 (team: 25)
- **Updated**: 2026-04-25
- **Agent**: codex

### Index digest

**team** — 25 pages
- [[agent-native-iteration-plan-2026-04-24]] — ai-memex-cli 从 CLI-first 转向 agent-native wiki 工作流的迭代计划文档
- [[agent-first-memex-workflow]] — agent skill 是主界面，CLI 是工具箱的产品与架构原则
- [[agent-native-architecture]] — ai-memex-cli 三层架构设计：Agent Interface、Workflow Protocol、CLI Toolbox
- [[cli-toolbox-boundary]] — CLI 不负责语义写作、不调 LLM API、只做机械原语的架构边界定义
- [[multi-agent-installation]] — agent profiles、slash prompts、skills、context files、user/project scope
- …20 more (run `memex status --scene team`)

### How to use memex from this session

- `memex search "<topic>"` — keyword + full-text search across the wiki
- `memex inject --task "<current goal>"` — pull the most relevant pages for your task
- `memex fetch <url|query>` — fetch web docs / search results into `raw/`
- `memex distill` / `memex ingest` — convert sessions/raw into structured wiki
- `memex watch` — auto ingest → lint → ingest loop when `raw/` changes
- `memex --help` — full command list

> 💡 **Before answering domain questions or starting non-trivial work, consult `memex inject --task "<what you are trying to do>"` to load relevant wiki pages.**

<!-- memex:context:end -->
