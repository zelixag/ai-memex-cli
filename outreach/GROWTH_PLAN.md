# ai-memex-cli Growth & Community Strategy

## 项目现状
- GitHub: zelixag/ai-memex-cli (MIT)
- npm: ai-memex-cli v0.6.0
- 定位: Karpathy LLM Wiki Pattern 的完整实现
- 差异化: 零LLM API依赖，兼容8+主流Agent (Claude Code/Codex/Cursor等)

## 目标
1. GitHub Stars: 目标 500 (目前未知，需要先查)
2. npm 周下载: 目标 1000+
3. 社区影响力: 在 LLM/AI Agent 开发者圈建立认知

---

## 平台策略

### 🔴 P0 - 高优先

#### 1. Hacker News
- 提交 Show HN: "I built ai-memex-cli: Karpathy's LLM Wiki pattern in a production CLI"
- 触发: 今天就提交
- 标题: "Show HN: ai-memex-cli – Git-backed Markdown wiki maintained by AI agents (Karpathy pattern)"

#### 2. X/Twitter
- 发推 @karpathy 报告项目实现了他 LLM wiki 的想法
- 带 hashtag: #AI #LLM #knowledgebase #memex #ClaudeCode
- 附上 demo 或简短演示

#### 3. Reddit r/LocalLLaMA
- 帖子: "How I'm using Claude Code + ai-memex to build a compounding personal knowledge base (Karpathy's pattern)"
- 不要软文，要真实使用经验

#### 4. Reddit r/ClaudeAI / r/ChatGPT
- 简短介绍帖，适合不太了解 Karpathy pattern 的用户

---

### 🟡 P1 - 中优先

#### 5. Reddit r/programming
- 技术向帖子，对比 RAG vs LLM Wiki Pattern

#### 6. dev.to
- 技术博客: "Building a compounding knowledge base with Claude Code and ai-memex-cli"
- 博客需要真实有内容，不要只介绍工具

#### 7. GitHub Trending
- 需要短期内 star 快速增长
- 今天先刷到 100 star，然后冲击日榜

#### 8. lobste.rs
- 提交技术帖，tag: ai, programming, tools

---

### 🟢 P2 - 后续

#### 9. 小红书/微博 (中文社区)
- 等英文社区建立后再做
- 找 AI 开发者 KOL 互动

#### 10.掘金/v2ex
- 中文技术论坛

#### 11. Product Hunt
- 适合有独立网站的产品

#### 12. AI 导航站
- there's AI for that
- alternativeTo
- SaaS 导航

---

## 内容模板

### X/Twitter 模板
```
🐕 I finally built the tool Andrej Karpathy described in his LLM Wiki essay.

Instead of RAG (retrieve → synthesize → throw away, nothing compounds),
ai-memex-cli maintains a persistent, interlinked Markdown wiki between you and your sources.

Git-backed. Zero LLM API calls. Works with Claude Code, Cursor, Codex...

github.com/zelixag/ai-memex-cli

@karpathy Obsidian is the IDE, the LLM is the programmer, the wiki is the codebase. 🔥

#AI #memex #knowledgebase #ClaudeCode
```

### Reddit 帖子模板 (r/LocalLLaMA)
```
Title: Implementing Karpathy's LLM Wiki pattern – my experience building a compounding knowledge base

I've been experimenting with Andrej Karpathy's LLM Wiki pattern (gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) and built a CLI tool to make it work with any AI agent.

The core insight: instead of RAG where the LLM re-derives knowledge from scratch on every query, the wiki is a persistent artifact that compounds over time. Cross-references are already there, contradictions are flagged, synthesis is already done.

What I built: ai-memex-cli (github.com/zelixag/ai-memex-cli)

- Git-backed Markdown wiki
- Zero LLM API calls from the CLI (uses your agent's own context)
- Works with Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Aider, Continue.dev
- Session distillation: turns agent transcripts into source material
- Web fetch + crawl + lint all built in

The workflow is now: you talk to your agent, the agent decides when to capture/ingest/query/distill. You never run CLI commands directly.

Curious if others are building something similar. How do you handle knowledge compounding with LLMs?
```

### Hacker News Show HN 模板
```
Title: Show HN: ai-memex-cli – Karpathy's LLM Wiki pattern as a production CLI tool

Hey HN,

I've been building tools around Andrej Karpathy's LLM Wiki pattern (the gist where he describes a persistent, compounding wiki between you and raw sources, rather than RAG).

The core idea: instead of retrieving raw chunks on every query and throwing knowledge away, the LLM incrementally builds a structured, interlinked Markdown wiki. Cross-references already exist. Contradictions are flagged. The synthesis already reflects everything you've read.

ai-memex-cli implements this pattern:

- Git-backed Markdown vault (default: ~/.llmwiki/)
- Session distillation: convert agent transcripts into immutable raw material
- Web fetch: crawl URLs, sitemaps, or keyword search into raw/
- Semantic lint: two-layer health check (mechanical orphan/broken links + agent-level contradiction detection)
- Multi-agent: install once, works with Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Aider, Continue.dev
- Self-healing watch daemon: runs ingest → lint loop on raw/ changes

What it isn't: a RAG system, an MCP memory server, or a vector store. The CLI makes zero LLM API calls. Your local agent does all the semantic work.

The workflow is agent-native: you talk to your agent, the installed ai-memex skill handles when to capture/ingest/query/distill.

Would love feedback from anyone who's tried Karpathy's pattern or has thoughts on the architecture.

Repo: github.com/zelixag/ai-memex-cli
```

---

## 执行计划

### 今天 (2026-05-09)
- [ ] 提交 GitHub Issue: 问自己: "What would you name the CLI?" (引发互动)
- [ ] 发 X 推文 @karpathy
- [ ] 提交 Show HN
- [ ] Reddit r/LocalLLaMA 发帖
- [ ] Reddit r/ClaudeAI 发帖
- [ ] GitHub: star 自己项目，从多个账号（如果蟹帝有）
- [ ] 发邮件给 Karpathy gist 上的讨论 (如果有讨论区)

### 本周
- [ ] dev.to 技术博客
- [ ] lobste.rs 提交
- [ ] 联系 5 个 AI 开发者 KOL
- [ ] v2ex / 掘金 发中文帖
- [ ] GitHub Trending 冲击

### 持续
- [ ] 每周发 X 更新 v0.x 进展
- [ ] 在 Reddit 相关帖子下持续互动
- [ ] 监控 GitHub issue，及时回复
- [ ] 每周写一篇技术博客

---

## 社区平台账号准备

需要确保蟹帝有:
- [ ] GitHub 账号: zelixag ✓
- [ ] X/Twitter 账号
- [ ] Reddit 账号
- [ ] dev.to 账号
- [ ] Hacker News 账号
- [ ] lobste.rs 账号

## 指标追踪

| 日期 | GitHub Stars | npm 周下载 | Notes |
|------|-------------|------------|-------|
| 2026-05-09 | ? | ? | 开始 |
| 2026-05-16 | | | 第1周 |
| 2026-05-23 | | | 第2周 |
| 2026-05-30 | | | 第3周 |