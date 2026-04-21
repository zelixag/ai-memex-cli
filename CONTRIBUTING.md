# Contributing to ai-memex-cli

**English** · [简体中文](#简体中文)

This document is for **maintainers and contributors** — if you just want to use the CLI, see [`README.md`](./README.md).

---

## Dev setup

```bash
pnpm install
pnpm build
pnpm test
```

Tests live in `tests/` and run under Vitest. The wiki self-healing loop has its own TDD spec at `tests/core/ingest-lint-loop.test.ts` (12 behavioral contracts — clean convergence, `lintReport` propagation, no-progress guard, `--force` bypass, `stopSignal`, `skipFirstIngest`, reporter ordering, unlimited iterations, ingest-error resilience).

Before opening a PR: `pnpm build && pnpm test:run` should be green.

---

## Release pipeline

Cutting a release is a **single command** that dog-foods Claude Code to keep docs honest:

```bash
pnpm release              # interactive patch release (default)
pnpm release:minor        # bump minor
pnpm release:major        # bump major
pnpm release:dry          # preview without publishing (no commit, no npm publish)
pnpm release:no-agent     # skip the Claude doc-sync stage
```

Under the hood, `scripts/release.mjs` walks through 10 steps:

1. **Preflight** — clean tree / target branch / `pnpm` + `claude` available / npm login check.
2. **Doc sync via Claude Code** — passes `git log` + `git diff --stat` since the last tag to `claude -p ... --permission-mode acceptEdits`. The agent is explicitly allowed to edit:
   - `CHANGELOG.md`
   - `README.md`, `README.zh-CN.md`
   - The whole `docs/website/client/src/` source tree — i18n files **and** the section components (`CommandsSection.tsx`, `FeaturesSection.tsx`, `ComparisonSection.tsx`, etc.), because adding a new CLI command requires touching the component, not just the i18n string.

   And explicitly **forbidden** to edit: `package.json` (any), `pnpm-lock.yaml`, `docs/website/client/src/components/ui/**` (shadcn atoms), and the built output under `docs/index.html`, `docs/assets/**`, `docs/.nojekyll` — those get regenerated in step 6.
3. **Mid-flight review** — prints the files the agent touched, you accept or abort. Early bail-out so you don't waste a build on bad edits.
4. **Version bump** — semver patch/minor/major on `package.json`.
5. **Build CLI** — `pnpm build` must pass.
6. **Rebuild docs/** — if the agent touched anything under `docs/website/client/src/`, the script runs `(cd docs/website && pnpm install --frozen-lockfile && pnpm build:gh-pages)` to regenerate `docs/index.html` + `docs/assets/**`. Controlled by `--rebuild-docs` (force) / `--no-rebuild-docs` (skip). Default is **auto** — rebuild only when source changed.
7. **Tests** — `pnpm test:run` (skip with `--skip-tests`).
8. **Final review before commit** — last look at `git status --porcelain` including the rebuilt `docs/` artifacts.
9. **Git commit + tag** — one commit `release: vX.Y.Z`, one tag `vX.Y.Z`.
10. **`pnpm publish`** + optional `git push` of the commit and tag.

Flags: `--dry-run`, `--no-agent`, `--skip-tests`, `--yes`, `--push`, `--branch <name>`, `--bump <level>`, `--rebuild-docs` / `--no-rebuild-docs`. Run `node scripts/release.mjs --help` for the full reference.

A legacy `pnpm release:changelogen` script is kept for the old changelogen-only workflow, in case the agent stage is unavailable (e.g. CI without the `claude` binary).

### Which bump level?

| Level     | Use when                                                                     | Example                |
| --------- | ---------------------------------------------------------------------------- | ---------------------- |
| **patch** | Bug fixes, doc-only changes, internal refactors — no user-visible behavior change | `0.1.3` → `0.1.4`      |
| **minor** | New commands, new flags, new optional behavior — backwards compatible       | `0.1.3` → `0.2.0`      |
| **major** | Breaking changes — renamed/removed commands, changed default behavior       | `0.1.3` → `1.0.0`      |

While the project is still `0.x`, breaking changes can also land in minor bumps (SemVer allows this for initial development). Once we cut `1.0.0`, strict SemVer applies.

---

<a name="简体中文"></a>

[English](#contributing-to-ai-memex-cli) · **简体中文**

本文档面向**维护者和贡献者** —— 只是想用 CLI 的话看 [`README.md`](./README.md) 就够了。

---

## 开发环境

```bash
pnpm install
pnpm build
pnpm test
```

测试在 `tests/` 下跑 Vitest。wiki 自愈循环有独立的 TDD 规约 `tests/core/ingest-lint-loop.test.ts`（12 条行为契约 —— 洁净收敛、`lintReport` 传递、无进展保护、`--force` 旁路、`stopSignal`、`skipFirstIngest`、reporter 顺序、无限迭代、ingest 错误韧性）。

开 PR 前请确保 `pnpm build && pnpm test:run` 是绿的。

---

## 发布流程

切一个版本是**一条命令**的事，而且它会调用你本地的 Claude Code 来保持文档与代码一致：

```bash
pnpm release              # 交互式 patch 发布（默认）
pnpm release:minor        # minor 升级
pnpm release:major        # major 升级
pnpm release:dry          # 预演不真发（不提交、不发 npm）
pnpm release:no-agent     # 跳过 Claude 文档同步阶段
```

背后的 `scripts/release.mjs` 走 10 步：

1. **Preflight** —— 工作区洁净 / 目标分支 / `pnpm` + `claude` 可用 / npm 登录检查。
2. **Claude Code 同步文档** —— 把"上一次 tag 以来的 `git log` + `git diff --stat`"喂给 `claude -p ... --permission-mode acceptEdits`。**允许编辑**的文件：
   - `CHANGELOG.md`
   - `README.md`、`README.zh-CN.md`
   - 整个 `docs/website/client/src/` 源码树 —— i18n **以及**各个 Section 组件（`CommandsSection.tsx`、`FeaturesSection.tsx`、`ComparisonSection.tsx` 等），因为新增一个 CLI 命令要同时改组件结构（图标映射 + usage 示例）和 i18n 文本。

   **禁止编辑**：任何 `package.json`、`pnpm-lock.yaml`、`docs/website/client/src/components/ui/**`（shadcn 原子）、以及构建产物 `docs/index.html`、`docs/assets/**`、`docs/.nojekyll` —— 这些由第 6 步自动重建。
3. **中途 review** —— 打印 agent 改动的文件清单，你决定继续还是中止。在构建之前 bail，省得浪费时间。
4. **版本 bump** —— semver patch / minor / major 写入 `package.json`。
5. **构建 CLI** —— `pnpm build` 必须通过。
6. **重建 docs/** —— 如果 agent 碰过 `docs/website/client/src/` 下的任何文件，脚本会自动 `(cd docs/website && pnpm install --frozen-lockfile && pnpm build:gh-pages)` 重新生成 `docs/index.html` + `docs/assets/**`。可用 `--rebuild-docs`（强制重建）/ `--no-rebuild-docs`（跳过）覆盖。默认 **auto** —— 源码有变才重建。
7. **测试** —— `pnpm test:run`（可用 `--skip-tests` 跳过）。
8. **提交前终审** —— 再看一眼 `git status --porcelain`，把重建好的 `docs/` 产物也一起过目。
9. **Git commit + tag** —— 一条 commit `release: vX.Y.Z`，一个 tag `vX.Y.Z`。
10. **`pnpm publish`** + 可选的 `git push`（commit 与 tag）。

可用 flag：`--dry-run`、`--no-agent`、`--skip-tests`、`--yes`、`--push`、`--branch <name>`、`--bump <level>`、`--rebuild-docs` / `--no-rebuild-docs`。完整参考：`node scripts/release.mjs --help`。

旧的 `pnpm release:changelogen` 脚本作为**降级路径**保留，适用于 agent 阶段不可用的场景（比如没装 `claude` 的 CI 环境）。

### 该用哪个 bump 级别？

| 级别      | 适用场景                                                        | 例子                   |
| --------- | --------------------------------------------------------------- | ---------------------- |
| **patch** | Bug 修复、仅文档改动、内部重构 —— 用户感知不到行为变化           | `0.1.3` → `0.1.4`      |
| **minor** | 新增命令、新增 flag、新增可选行为 —— 向后兼容                    | `0.1.3` → `0.2.0`      |
| **major** | 破坏性变更 —— 命令改名/删除、默认行为改变，旧脚本会挂掉         | `0.1.3` → `1.0.0`      |

项目还在 `0.x` 阶段，破坏性变更也可以在 minor 里出（SemVer 对初始开发期放宽了规则）。一旦切到 `1.0.0`，就严格按 SemVer 来。
