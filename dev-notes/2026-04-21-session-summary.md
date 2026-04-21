# 会话整理：2026-04-21（ai-memex-cli）

本文档整理当日与 AI 助手讨论与落地的要点，便于日后查阅与续作。**非用户文档**，不参与 npm 包发布；GitHub Pages 使用仓库根下 `docs/` 的构建产物，本文件放在 `dev-notes/` 以免与站点混淆。

---

## 1. 产品方向与 README

- **方向**：CLI 对齐 **Karpathy 的 LLM Wiki pattern**（持久 Markdown wiki、由本地 agent 维护、知识复利而非每轮重推）；与 **Memex / Bush** 叙事一致；明确 **不是** RAG、不是 MCP 黑盒记忆、**memex 本体不调 LLM API**。
- **落地**：上述叙事已写入 `README.md` / `README.zh-CN.md`；维护者流程迁到 `CONTRIBUTING.md`，README 只保留指向贡献指南的简短说明。

---

## 2. 发版流程与「Dry release」

- **自动化**：`scripts/release.mjs` 十步管线（preflight → agent 文档同步 → 人工确认 → bump → build CLI → 重建文档站 → 测试 → 再确认 → commit/tag → publish → 可选 push）；支持 `--dry-run`、`--no-agent`、`--rebuild-docs` 等。
- **Dry release（干跑）**：`pnpm release:dry` —— **预演**发版（检查、构建、publish dry-run 等），**避免**不可逆操作（如真实 `pnpm publish`、随意 bump 写盘策略以脚本为准）。类比彩排：流程走一遍，不当真发 npm、不依赖你本机 OTP。

---

## 3.「Skill + 脚本」分层（发布）

- **共识**：机械步骤（bump / build / test / tag / publish）保留在 **脚本**；需要判断与多文件编辑的（CHANGELOG / 双 README / 站点）交给 **Claude**；**入口**可用薄 **Skill**，不要把整段长 prompt 永久塞进 `release.mjs`（可读性与维护差）。
- **落地**：在仓库增加 **`.claude/skills/release-ai-memex-cli/`**：
  - `SKILL.md`：何时用、硬规则、与 `release.mjs` / `CONTRIBUTING.md` 的关系；
  - `reference/sync-docs-for-release.md`：文档同步契约（允许/禁止路径、双语、**站点源码为 `website/client/src/`** 等）；
  - `scripts/sync-gh-pages.mjs`：`website` 下 `build:gh-pages` 后将 `dist/public` 同步到 `docs/`。
- **根脚本**：`package.json` 增加 `pnpm run docs:sync`，调用上述脚本。
- **npm 包**：`package.json` 的 `files` 未包含 `.claude/`，发 npm 不包含 skill，仅供克隆仓库的贡献者 / Claude Code 使用。

> **与 `release.mjs` 的差异**：`reference/` 已按 **`website/`** 描述站点；若 `AGENT_PROMPT_TEMPLATE` 仍写 `docs/website/`，后续应统一改为 `website/`，避免双源。

---

## 4. Website 与 GitHub Pages

- **内容**：按英文 README 更新 Hero / Features / Commands；补 **watch**、**context**；修正 **distill** 旧 flag；Architecture（含 `team/sessions/`、Layer 2 命令串）、Comparison（与 README 表一致的 8 行）、Quick Start 与 README 流程对齐。
- **i18n**：`website/client/src/i18n/`（`en-US.ts` / `zh-CN.ts`）+ `I18nProvider`；Navbar 语言切换；多组件接 `useI18n()`。
- **构建与同步**：`website/package.json` 增加 `build:gh-pages`（`base=/ai-memex-cli/`）；通过 `pnpm run docs:sync` 将产物拷入 `docs/`；保留 `docs/.nojekyll`。

---

## 5. 测试与 Windows 已知问题

- 全量 `pnpm test:run` 在 Windows 上曾有 **7 个失败**（`fs.test` 路径断言与 `search` 行为），属 **pre-existing**，非当次发版引入；策略 A：先发布并在 CHANGELOG 标注 Known issues，再在后续版本修测试或产品行为。

---

## 6. 仓库的双重目标

1. **对外**：持续交付 **LLM Wiki 向** 的开源 CLI（文档、行为、npm 包一致）。
2. **对内**：本仓库作为 **AI coding 工程实践** 的载体（release skill、文档站 i18n、脚本与 agent 分工、CONTRIBUTING 管线等）。

---

## 7. 工作流反思：Superpower / SDD / TDD 与「文档跟着聊」

- **现象**：用 Superpower 等做 SDD/TDD 开局顺利，随后 **spec、测试、`CLAUDE.md` 易陈旧** —— 根因多为 **缺少闭环**：会话结束没有把结论写回仓库内「事实来源」的强制步骤。
- **OpenSpec**（如 [OpenSpec](https://openspec.dev/) / [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)）：通过 **Propose → Apply → Archive** 等，把变更 **归档进主规格**，有利于缓解 **spec 不更新**；**不能**单独保证 `CLAUDE.md` 永远最新，需配合 **DoD、Cursor/Claude 规则、或 memex `context refresh`** 等。
- **可选路径**：在仓库引入 OpenSpec **或** 仅在 `AGENTS.md` / rules 中固化 **Definition of Done**（改 CLI → 必须动 README / 测试 / CHANGELOG 草案 / 影响 onboarding 时动 agent 文件）；可与 **memex wiki + distill** 吃狗粮结合。

---

## 8. 建议的后续事项（备忘）

| 优先级 | 事项 |
|--------|------|
| 高 | 将 `scripts/release.mjs` 内 agent 提示中的 **`docs/website/`** 与 **`CONTRIBUTING.md`** 统一为 **`website/`**（若尚未改）。 |
| 中 | Windows 上 7 个失败测试：修正 `normalizePath` 测试断言；调查 `search` 在 temp vault 下无结果是否产品问题。 |
| 低 | 决定是否引入 **OpenSpec** 或仅加强 **DoD + CI**；ErrorBoundary / ManusDialog 是否接 i18n。 |

---

## 9. 相关路径速查

| 路径 | 说明 |
|------|------|
| `scripts/release.mjs` | 发版主脚本 |
| `CONTRIBUTING.md` | 维护者发版与开发说明 |
| `.claude/skills/release-ai-memex-cli/` | 发布相关 Claude skill |
| `website/client/src/` | 文档站源码 + i18n |
| `docs/` | GitHub Pages 构建输出（由 `docs:sync` 更新） |
| `pnpm release:dry` | 干跑发版 |
| `pnpm run docs:sync` | 构建站点并同步到 `docs/` |

---

*文档由会话整理生成，若与代码不一致以仓库当前文件为准。*
