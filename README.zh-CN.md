# ai-memex-cli

[English](./README.md) · **简体中文**

> 一个小型 CLI，把 [Karpathy 的 LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) 变成日常工作流 —— 让你的 AI agent **构建并维护**一份持久的 Markdown 知识库，让知识**累积复利**，而不是每次会话都从零重新推导。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/ai-memex-cli.svg)](https://www.npmjs.com/package/ai-memex-cli)

## 为什么要做这个

大多数 RAG 系统在每个问题上都是**从零重新推导**知识 —— 检索原始片段、临时综合、随即丢弃。**什么都没有累积下来。** Karpathy 的 pattern 提出了另一种形态：LLM **增量地构建和维护**一份结构化的、相互链接的 Markdown wiki，夹在你和原始资料之间。交叉引用已经在那里了。矛盾已经被标注了。综合视角已经反映了你读过的全部内容。

> **"Obsidian 是 IDE；LLM 是程序员；wiki 就是代码库。"** —— Karpathy

这其实是信息管理领域最古老的想法 —— Vannevar Bush 在 1945 年提出的 **Memex**。Bush 的愿景有一个未解之题：*谁来做维护？* LLM 刚好填补了这个缺口 —— 它们不会在更新交叉引用时感到厌倦，而且能在一个 pass 里触达 15 个页面。

**这个 CLI 是什么：** 一套让你可以"住进" Karpathy pattern 的**机械原语** —— 抓取原始资料、跑 ingest / query / lint、管理 `raw/` · `wiki/` · `index.md` · `log.md` · `AGENTS.md`，把真实的 agent 会话蒸馏回 wiki，为你在用的任何 agent 生成 slash 命令。

**它不是什么：** 它**不是** RAG 系统、**不是** MCP memory server、**不是**黑盒向量存储。CLI 本身**不调用任何 LLM API**。它只负责把正确的文件和 prompt 编排好；真正的"思考"全部交给你本地的 agent（Claude Code、Cursor、Codex、Gemini……）。wiki 本身就是 git 仓库里的纯 Markdown —— 你可以读、可以改、可以 diff、可以 blame。

---

## `memex` 能给你什么

### 核心管线 —— Karpathy pattern 的机械化

1. **Ingest（导入）** —— `memex fetch` 把资料抓进 `raw/`（URL、sitemap、DuckDuckGo 关键词搜索、agent 代抓）。`memex ingest` 再把 `raw/` 整颗树交给你的 agent，让它把新材料整合进 wiki：一次性更新 entity / concept 页面、index 和 log。
2. **Distill（蒸馏）** —— > *"好的回答应该被归档回 wiki 作为新页面"*（Karpathy）。`memex distill` 把你用过的**所有** agent 会话批量转换成结构化 Markdown，落到 `raw/<scene>/sessions/`，等待被再次 ingest。这是让**探索随阅读一起累积复利**的关键机制。
3. **Query（查询）** —— `memex search`（在整个 vault 里做关键词 / BM25 搜索）和 `memex inject`（按需把相关页面拉进 agent prompt）。
4. **Lint（自检）** —— `memex lint` / `memex link-check`：孤儿页、断裂的 `[[wikilink]]`、缺失的 frontmatter、过时的交叉引用 —— Karpathy 原文里描述的周期性健康检查。
5. **你拥有的 schema** —— `AGENTS.md` 是 wiki 的"宪法"，由你和 LLM 协同演化而成。`memex init` 给你一份可以直接用的默认版本；去按你的领域改它。
6. **slash 命令，随处可用** —— `memex install-hooks` 为 Claude Code、Codex、OpenCode、Cursor、Gemini CLI、Aider、Continue.dev 生成原生的 `/memex:*` 命令，让你在任何 agent 聊天界面里都能触发整条管线。

### 进阶 / 实验特性（不在 Karpathy 原版里）

这些是**叠加**在核心管线之上的能力，**默认关闭**。有用，但有倾向性 —— 当作实验对待，小步启用。

- **`memex watch --daemon --heal`** —— 长驻后台循环，跑 `ingest → lint → ingest` 直到 wiki 的 issue 归零。方便，但它会**自主**烧 agent 的 token；先用前台的 `memex watch --once` 试，**确信**这个循环在你的 vault 上行为可控了，再考虑后台化。
- **`memex context install`** —— 把一段带 marker 的"vault 摘要"区块写进你项目根下的 agent 文件（`CLAUDE.md` / `AGENTS.md` / `.cursor/rules/memex.mdc`），让每次新起 agent 会话在第 0 turn 就带上 vault 位置和 scene 摘要。这其实是 **agent-memory 议题**，不在 Karpathy pattern 范围内；安装前先想清楚是否跟你已经手写的 Cursor skills / CLAUDE.md 有价值的重叠。
- **跨 agent prompt 层** —— 通过 prompt 模板（不是 MCP）覆盖 8 个 agent。在 Claude Code / Codex / OpenCode 上表现好；其他 agent 的质量**因 agent 而异**。

### 与其他方案的对比

| 特性 | ai-memex-cli | atomicmemory/llm-wiki-compiler | ussumant/llm-wiki-compiler | SamurAIGPT/llm-wiki-agent | rohitg00/agentmemory |
|------|--------------|--------------------------------|----------------------------|---------------------------|----------------------|
| **架构** | 无状态 CLI + Agent Prompt | 独立 CLI（直接调 LLM API） | Claude Code 插件 | 纯 Markdown Prompt | TypeScript MCP Server |
| **Agent 支持** | **通用（8+ 个 agent）** | 仅 Anthropic API | 仅 Claude Code | 仅 Claude Code | 仅 MCP 兼容 |
| **网页抓取** | **内置爬虫 + 关键词搜索** | 单 URL 导入 | 无 | 无 | 无 |
| **会话蒸馏** | **支持（批量、结构化 MD）** | 无 | 无 | 无 | 支持（后台） |
| **Slash 命令** | **为所有 agent 自动生成** | 无 | 内置（插件） | 手动配置 | 不适用 |
| **交互式引导** | **有（向导）** | 无 | 无 | 无 | 无 |
| **自更新** | **有（`memex update`）** | 无 | 无 | 无 | 无 |
| **费用** | **免费（复用 agent 会话）** | 需要 API Key | 免费（复用 Claude 会话） | 免费 | 需要 API Key |

---

## 安装与快速开始

```bash
# 通过 npm 全局安装
npm install -g ai-memex-cli

# 或直接从 GitHub 安装
npm install -g github:zelixag/ai-memex-cli

# 验证安装
memex --version
```

### 1. 交互式引导

运行引导向导，选择你的 AI agent 并初始化 global vault。

```bash
memex onboard
```

向导会走完 5 步：
- **Step 1：** 选择 AI agent（Claude Code、Codex、OpenCode、Cursor、Gemini CLI、Aider、Continue.dev、或 Generic）
- **Step 2：** 自动探测 agent 的会话目录（例如 Claude Code 的 `~/.claude/projects/`）
- **Step 3：** 在 `~/.llmwiki/global/` 初始化 global vault
- **Step 4：** 为选定的 agent 安装 slash 命令
- **Step 5：** 将配置保存到 `~/.llmwiki/config.json`

非交互环境（CI / 脚本）：

```bash
memex onboard --agent claude-code -y
```

### 2. 抓取知识

从网络上抓取文档 —— 按 URL 或按关键词。

```bash
# 抓取一个具体 URL
memex fetch https://react.dev/reference/react/hooks

# 通过 sitemap 爬整个文档站
memex fetch https://nextjs.org/sitemap.xml --sitemap --max-pages 50

# 带深度控制的递归爬取
memex fetch https://docs.anthropic.com --depth 2 --max-pages 30

# 按关键词搜索（不需要 URL！）
memex fetch "react hooks best practices" --top 5

# 中文关键词也支持
memex fetch "Kubernetes 部署最佳实践" --top 3 --yes

# 复杂场景委托给 agent 处理（JS 渲染、需要登录等）
memex fetch "OAuth2 PKCE flow" --agent claude-code
```

关键词搜索走 DuckDuckGo（无需 API Key），交互式列出候选，由你决定抓取哪些页面。

### 3. 导入进 wiki

让你的 agent 把 `raw/` 下的原始文件处理成结构化的 wiki 页面。

```bash
# 导入默认 raw/ 目录下的所有文件
memex ingest

# 导入某个目录或文件（支持模糊路径）
memex ingest raw/personal
memex ingest ~/docs/architecture.md

# 指定 agent
memex ingest --agent codex

# Dry-run：只预览 prompt 不真跑
memex ingest --dry-run
```

`ingest` 接受**模糊路径** —— agent 会自己搜索并解析实际文件，你不必给精确路径。

### 4. 蒸馏会话

刚结束一次复杂的 debug 会话？把你的 agent 生成过的**所有** session 文件批量转换成结构化 Markdown，立即可以被 ingest。

```bash
# 无参：批量转换当前 agent 的全部 session
memex distill

# 指定落点 scene（默认 team → raw/team/sessions/）
memex distill --scene personal

# 跳过可选的 LLM 摘要步骤（纯结构化转换）
memex distill --no-llm

# 转换指定文件
memex distill ./chat-log.jsonl

# Dry-run
memex distill --dry-run
```

输出写到 `raw/<scene>/sessions/*.md`，带 `source-type: session` frontmatter；每个文件都会被 `memex ingest` 当作一个独立的 source 文档处理。

以上就是核心闭环。**再往下的内容都是可选 / 有倾向的** —— 是在 Karpathy pattern 之上加的、为解决特定痛点而存在，但会用"简洁"换"自动化"。先浏览，之后再按需开启。

---

## 进阶工作流（可选、有倾向）

以下两个能力**不在 Karpathy 原版 pattern 里**。它们解决了真实痛点（无人值守的维护、会话启动即上下文），但带来了新的代价 —— agent token 的自主消耗、和既有 agent 规则的重叠。启用前请认真读一下。

### 持续自愈（`memex watch`）

`memex watch` 可以在后台跑 `ingest → lint → ingest` 循环，由 `raw/` 变动 *和/或* 周期性健康检查触发。一旦你对 agent 在自己 vault 上的行为有信心，它非常好用；反之则很贵（守护进程会**自主**触发真实的 agent 调用）。

```bash
# 前台 watcher（单次 ingest + lint 后退出）
memex watch --once

# 后台自愈循环（无限迭代、周期性健康检查）
memex watch --daemon --heal

# 查看实时状态（当前 phase、迭代轮次、处理文件、剩余 issue）
memex watch --status

# 实时跟踪守护进程日志（类似 `tail -f`）
memex watch --follow

# 停止守护进程
memex watch --stop

# 即使 agent 看起来卡住也强制继续（绕过 no-progress guard）
memex watch --daemon --force
```

守护进程把状态写到 `.llmwiki/watch.status.json`，把每一次 ingest 的完整命令行、prompt 开头、agent 的 stdout/stderr 流都串进 `.llmwiki/watch.log`。**推荐的首次运行路径**：先 `memex watch --once`（前台，单轮）→ 检视日志 → 再考虑 `--daemon --heal`。

### 会话起始上下文引导（`memex context`）

`memex context install` 会在你项目根下的 agent 文件里写入一段带 marker 的区块，让 vault 位置和 scene 摘要从第 0 turn 起就在上下文里。这跟 Cursor skills / 你手工维护的 `CLAUDE.md` 能做的事**有重叠** —— 先决定好：你希望 memex 来托管这一段，还是留给你自己。

```bash
# 在当前项目安装引导区块（自动探测 agent）
memex context install

# 指定某个 agent 对应的文件
memex context install --agent cursor

# 只写 vault 位置，不写摘要（minimal 模式）
memex context install --mode minimal

# 刷新所有已注册项目的区块
memex context refresh --all

# 查看所有注册项目 + 存活检查
memex context status

# 从当前项目移除区块
memex context uninstall
```

目标文件因 agent 而异（Claude Code → `CLAUDE.md`、Codex/OpenCode → `AGENTS.md`、Cursor → `.cursor/rules/memex.mdc`、Gemini CLI → `GEMINI.md` 等）。区块是**幂等**的 —— `refresh` 只重写 marker 包裹的那一段，周围的文本原样保留。`memex onboard` 和 `memex install-hooks` 会询问是否自动安装。

---

## 架构与数据流

`ai-memex-cli` 采用双 vault 体系：**Global Vault**（`~/.llmwiki/global/`）保存你跨项目累积的个人知识，**Local Vault**（`.llmwiki/local/`）承载项目级的局部上下文。

```text
┌─────────────────────────────────────────────────┐
│ Layer 3: Agent（Claude Code / Cursor / Codex）  │
│  - 读 raw 文档、写结构化 wiki 页面              │
│  - 综合概念、修复 lint 问题                     │
│  - 通过 Bash / Slash 命令调用 memex             │
└─────────────────────────────────────────────────┘
                       ↕（shell + 自然语言 prompt）
┌─────────────────────────────────────────────────┐
│ Layer 2: ai-memex-cli                           │
│  - 无状态原语：onboard / fetch /                │
│    ingest / distill / glob / inject / lint /    │
│    search / update / context                    │
│  - 自愈守护：watch（ingest ↔ lint）             │
│  - 负责路径解析、网页爬取、frontmatter 校验     │
└─────────────────────────────────────────────────┘
                       ↕（fs）
┌─────────────────────────────────────────────────┐
│ Layer 1: Vault（文件系统）                      │
│  ~/.llmwiki/global/    ← CLI 管理的源           │
│  <project>/.llmwiki/local/  ← agent 的投影      │
└─────────────────────────────────────────────────┘
```

### Vault 目录结构

```
~/.llmwiki/global/
├── AGENTS.md              # 给 agent 的 schema 与工作流规则
├── index.md               # wiki 索引（ingest 时由 agent 维护）
├── log.md                 # 只增不减的动作日志
├── raw/                   # 不可变原始资料（agent 永不写）
│   ├── personal/          # 个人笔记
│   ├── research/          # 抓取的文档、文章（`memex fetch` 默认落点）
│   ├── reading/           # 阅读材料
│   └── team/
│       └── sessions/      # 蒸馏过的 agent 会话（`memex distill` 默认落点）
├── wiki/                  # agent 维护的知识页
│   ├── personal/
│   ├── research/
│   ├── reading/
│   └── team/
│       ├── entities/      # 人、工具、组织（每个真实对象一页）
│       ├── concepts/      # 思想、模式、方法论
│       ├── sources/       # 每个外部文档（URL、PDF …）一页
│       └── summaries/     # 跨页综合（子类型：overview/comparison/synthesis）
└── .llmwiki/
    ├── config.json        # 单 vault 配置（被 gitignore）
    ├── watch.pid          # `memex watch --daemon` 的进程 ID
    ├── watch.log          # 自愈守护日志（ingest 命令 + prompt + agent 流）
    └── watch.status.json  # `memex watch --status` 读取的实时快照
```

每个 wiki 页面由**两个正交维度**分类：**scene**（`personal` / `research` / `reading` / `team`）× **type**（`entity` / `concept` / `source` / `summary`）。物理路径 = `wiki/<scene>/<type>s/<slug>.md`；frontmatter 里的 `type:` 字段使用**单数**形式。

---

## 命令参考

### 核心命令

| 命令 | 说明 |
|------|------|
| `memex onboard` | 交互式设置向导 —— 选 agent、探测 session 目录、初始化 vault、安装 hook、安装 L0 上下文区块 |
| `memex fetch <url\|关键词>` | 抓 URL、爬 sitemap、或按关键词搜索 —— 干净 Markdown 落到 `raw/` |
| `memex ingest [target]` | 编排 agent 把 raw 源处理成结构化 wiki 页（可接受 lint 报告驱动自愈） |
| `memex distill [session]` | 批量把 agent 会话文件转换成结构化 Markdown，落到 `raw/<scene>/sessions/` |
| `memex watch` | 自愈守护：响应 `raw/` 变动 + 周期性健康检查，驱动 `ingest ↔ lint` 循环直至收敛 |
| `memex context <sub>` | 管理会话起始上下文区块（`install` / `refresh` / `uninstall` / `status`）—— agent 会话的 L0 引导 |
| `memex glob --project <dir>` | 把全局 wiki 里相关页投影到项目本地 vault |
| `memex inject` | 输出拼接好的 wiki 上下文供 agent 消费 |
| `memex search <query>` | 在 wiki 与 raw 中全文搜索并相关性打分 |
| `memex lint` | 扫描 wiki 健康度（孤儿页、断链、缺失 frontmatter 等） |

### 辅助命令

| 命令 | 说明 |
|------|------|
| `memex init` | 手动初始化新的 vault |
| `memex new <type> <name>` | 基于模板脚手架一个新 wiki 页（entity / concept / source / summary） |
| `memex log <action>` | 追加一条格式化的条目到 `log.md` |
| `memex status` | 查看 vault 总览与统计（支持 `--json`） |
| `memex link-check` | 校验所有页面的 `[[wikilink]]` |
| `memex install-hooks` | 为你的 agent 生成自定义 slash 命令 |
| `memex config <sub>` | 管理 CLI 配置（`set` / `get` / `list` / `agents`） |
| `memex update` | 自更新到最新版（自动识别 npm / git 安装） |

### 命令详情

#### `memex fetch`

```bash
# 按 URL
memex fetch <url>                          # 单页
memex fetch <url> --depth 2 --max-pages 30 # 递归爬取
memex fetch <url> --sitemap --max-pages 50 # sitemap 爬取
memex fetch <url> --include "/docs/"       # 按路径 pattern 过滤

# 按关键词（DuckDuckGo，无需 API Key）
memex fetch "<关键词>"                     # 交互式选择
memex fetch "<关键词>" --top 5             # 限制结果数
memex fetch "<关键词>" --yes               # 自动抓取全部结果
memex fetch "<关键词>" --agent claude-code # 委托给 agent

# 通用选项
--scene <scene>     # 目标 scene 目录（research/personal/reading）
--out <filename>    # 自定义输出文件名
--dry-run           # 只预览不抓取
```

#### `memex ingest`

```bash
memex ingest                    # 默认：导入 raw/ 下所有文件
memex ingest raw/personal       # 模糊路径 —— agent 自己解析
memex ingest ~/docs/notes.md    # 指定文件
memex ingest --agent codex      # 指定 agent
memex ingest --dry-run          # 只预览 prompt
```

#### `memex distill`

```bash
memex distill                        # 批量转换当前 agent 的全部 session
memex distill --scene personal       # 落到 raw/personal/sessions/
memex distill --no-llm               # 跳过可选的 LLM 摘要步骤
memex distill ./session.jsonl        # 转换指定文件
memex distill --agent claude-code    # 覆盖 agent（路径自动探测）
memex distill --dry-run              # 只预览 prompt，不写入
```

每个 session 都会被渲染成一份带 YAML frontmatter 的 Markdown（`source-type: session`、`started`、`ended`、`turns`、`sources`），外加逐轮的 `## 👤 User` / `## 🤖 Assistant` 区块。**JSONL 永远不会被拷贝进 vault** —— CLI 从 agent 的源目录读取，只写入渲染后的 Markdown。

#### `memex watch`

```bash
# 触发模式
memex watch --once                     # 单次 ingest + lint 后退出
memex watch                            # 前台持续循环
memex watch --daemon                   # 脱钩后台守护

# 自愈控制
memex watch --daemon --max-iter 0      # 无限迭代（∞）—— 默认
memex watch --daemon --max-iter 5      # 每批最多 5 轮
memex watch --daemon --force           # 绕过"无进展"保护
memex watch --daemon --heal            # 同时启用周期性健康检查
memex watch --daemon --heal-interval 300000   # 每 5 分钟检查一次
memex watch --daemon --no-heal-on-start       # 跳过启动时的首次检查

# 可观测性
memex watch --status                   # 结构化快照：phase、迭代、文件、issue、统计
memex watch --follow                   # tail -f 守护进程日志
memex watch --stop                     # 停止守护进程
```

守护进程写 `.llmwiki/watch.{pid,log,status.json}`。每轮 ingest 记录完整命令行、prompt 开头和 agent 的 stdout/stderr 流；每轮 lint 记录结构化 issue 列表 —— 所以 `watch --follow` 就是一份完整的审计轨迹。

#### `memex context`

```bash
memex context install                  # 写入 L0 区块到项目根（自动探测 agent）
memex context install --agent cursor   # 指定 agent 对应的文件
memex context install --mode minimal   # 跳过 wiki 摘要（只写 vault 位置）
memex context refresh --all            # 刷新所有已注册项目的区块
memex context uninstall                # 从当前项目移除区块
memex context status                   # 列出所有已注册项目 + 存活检查
```

区块由 `<!-- memex:context:start -->` / `<!-- memex:context:end -->` 作为边界 —— `refresh` 只重写 marker 之间的内容，周围的文本原样保留。注册表存放在 `~/.llmwiki/contexts.json`；`memex watch` / `memex ingest` 在每次 lint 洁净通过后会静默调用 `refresh --all`，让摘要保持最新。

#### `memex config`

```bash
memex config list              # 显示全部配置
memex config get agent         # 读取某个 key
memex config set agent codex   # 设置默认 agent
memex config agents            # 列出所有支持的 agent
```

#### `memex update`

```bash
memex update                   # 自更新（自动识别 npm 或 git）
memex update --check           # 只检查，不升级
memex update --source github   # 强制从 GitHub 更新
memex update --source npm      # 强制从 npm 更新
```

---

## Agent Slash 命令

跑过 `memex onboard` 或 `memex install-hooks` 之后，你可以直接在 agent 的聊天界面里触发 CLI。

### Claude Code

```
/memex:help                          # 列出全部命令
/memex:status                        # 查看 vault 总览
/memex:fetch https://docs.example.com # 抓取文档
/memex:fetch "react hooks tutorial"  # 按关键词搜索并抓取
/memex:ingest raw/personal           # 处理 raw 文件
/memex:distill                       # 批量蒸馏全部会话
/memex:search "authentication"       # 搜索知识库
/memex:lint                          # 健康检查
/memex:watch --daemon --heal         # 启动自愈守护进程
/memex:new concept "React Hooks"     # 新建页面
```

### 支持的 agent

| Agent | 命令格式 | 生成文件 |
|-------|----------|----------|
| Claude Code | `.claude/commands/memex-*.md` | 10 个 slash 命令 |
| Codex | `AGENTS.md` 章节 | 嵌入式命令 |
| OpenCode | `.opencode/commands/memex-*.md` | 10 个 slash 命令 |
| Gemini CLI | `.gemini/commands/memex-*.md` | 10 个 slash 命令 |
| Cursor | `.cursor/rules/memex.mdc` | 规则文件 |
| Aider | `.aider/commands/memex-*.md` | 10 个 slash 命令 |
| Continue.dev | `.continue/commands/memex-*.md` | 10 个 slash 命令 |

---

## 页面格式

所有 wiki 页面都用 YAML frontmatter 记元数据，用 `[[wikilink]]` 做交叉引用：

```yaml
---
name: React Hooks
description: Modern state management in React
type: concept
scene: research
tags: [react, frontend, hooks]
updated: 2026-04-16
related: [[react-state-management]]
sources: [react-docs-2026]
---

# React Hooks
...
```

页面类型：`entity`（人、工具、组织）、`concept`（思想、模式）、`source`（引用来源）、`summary`（综合概览）。

---

## 跨平台支持

`ai-memex-cli` 在 **Windows**、**macOS** 和 **Linux** 上都能正常工作。所有路径会被自动标准化：

- `~` 在所有平台上都会展开为你的 home 目录
- Windows 反斜杠路径（`~\.llmwiki\global\raw`）能正确处理
- 不论你在 `.llmwiki/` 里还是外面，vault 解析都能工作

---

## 开发

```bash
git clone https://github.com/zelixag/ai-memex-cli.git
cd ai-memex-cli
pnpm install
pnpm build
pnpm test
```

我们使用 Vitest 做测试。测试覆盖所有命令、核心模块和边界 case —— 其中为 wiki 自愈循环单独写了一份 TDD 规约（`tests/core/ingest-lint-loop.test.ts`），锁定了 12 条行为契约（洁净收敛、`lintReport` 在迭代间传递、无进展保护、`--force` 旁路、`stopSignal`、`skipFirstIngest`、reporter 事件顺序、无限迭代、以及 ingest 错误时的韧性）。

维护者发布新 npm 版本前请阅读 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

---

## 许可证

MIT License © 2026
