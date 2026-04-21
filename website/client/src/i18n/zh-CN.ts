/**
 * 网站默认文案（简体中文）。CLI 命令与代码块保持英文以便复制运行。
 */
export const zhCN = {
  meta: {
    title: "ai-memex-cli — Karpathy LLM Wiki 的日常工作流",
    description:
      "把 Karpathy 的 LLM Wiki pattern 变成可复利的持久 Markdown 知识库。无状态 CLI + 本地 agent，零 LLM API 调用。",
  },
  ui: {
    switchToZh: "中文",
    switchToEn: "English",
    languageToggleAria: "切换界面语言",
  },
  navbar: {
    links: [
      { label: "特性", href: "#features" },
      { label: "架构", href: "#architecture" },
      { label: "命令", href: "#commands" },
      { label: "对比", href: "#comparison" },
      { label: "快速开始", href: "#quickstart" },
    ],
    github: "GitHub",
    getStarted: "开始使用",
  },
  hero: {
    imgAlt: "知识制图工作台",
    badge: "Karpathy LLM Wiki 的机械化",
    titleLine1: "让知识",
    titleLine2: "复利累积",
    subtitleBefore:
      "一个小型 CLI，把 ",
    subtitleLink: "Karpathy 的 LLM Wiki pattern",
    subtitleAfter:
      " 变成日常工作流 —— 让你的 agent 构建并维护一份持久的 Markdown 知识库，让知识累积复利，而不是每次会话都从零重新推导。",
    quote: "“Obsidian 是 IDE；LLM 是程序员；wiki 就是代码库。”",
    quoteAuthor: "—— Andrej Karpathy",
    copyTitle: "复制到剪贴板",
    copy: "复制",
    quickStart: "快速开始指南",
    viewGithub: "在 GitHub 上查看",
  },
  features: {
    sectionTitle: "核心管线",
    sectionSubtitle:
      "让 Karpathy pattern 易于日常使用的机械原语 —— 抓取、蒸馏、查询、Lint，以及你拥有的 schema。",
    blocks: [
      {
        title: "构建 wiki",
        subtitle: "Karpathy pattern 的机械化",
        description:
          "memex fetch 把原始资料放进 raw/（URL、站点地图、DuckDuckGo 关键词搜索或委托 agent 抓取）。memex ingest 再把 raw/ 交给 agent，让它把新材料整合进 wiki/ —— 一次性更新 entity / concept 页面、索引与日志。交叉引用已经在那里。",
        code: `memex fetch "react hooks best practices" --top 5
memex fetch https://nextjs.org/sitemap.xml --sitemap
memex ingest`,
      },
      {
        title: "蒸馏会话",
        subtitle: "探索随阅读一起累积复利",
        description:
          "「好的回答应该被归档回 wiki 作为新页面。」memex distill 把你用过的所有 agent 会话批量转成结构化 Markdown，落在 raw/<scene>/sessions/，等待再次 ingest。这是让昨天啃过的难题，能照亮明天提问的机制。",
        code: `memex distill
memex distill --scene personal
memex distill --no-llm`,
      },
      {
        title: "一个 CLI，覆盖所有 agent",
        subtitle: "零 LLM API 调用 —— 思考交给你的 agent",
        description:
          "兼容 Claude Code、Codex、OpenCode、Cursor、Gemini CLI、Aider、Continue.dev。memex 本身不调用任何大模型 API —— 只编排文件与 prompt；真正的推理在你本地 agent 的会话里。wiki 是纯 Markdown，可 git diff / blame。",
        code: `memex onboard
memex install-hooks --agent cursor
memex ingest --agent codex`,
      },
    ],
    small: [
      {
        title: "按需查询",
        description:
          "memex search 在整库做关键词 / BM25 排序。memex inject 在会话需要时把相关 wiki 页拼进 agent prompt。",
      },
      {
        title: "可 Lint 的健康度",
        description:
          "memex lint / memex link-check 标记孤儿页、断裂的 [[wikilink]]、缺失 frontmatter、过时交叉引用 —— Karpathy 描述的周期性健康检查。",
      },
      {
        title: "你拥有的 schema",
        description:
          "AGENTS.md 是 wiki 的「宪法」，由你与 LLM 协同演化。memex init 给默认可用版本；按你的领域去改。",
      },
    ],
    advanced: {
      kicker: "不在 Karpathy 原版里 —— 有倾向性，按需启用",
      title: "进阶工作流",
      subtitleBefore: "这些能力叠加在核心管线之上，且",
      subtitleStrong: "默认关闭",
      subtitleAfter:
        "。有用，但用自动化换简洁 —— 先通读，小步打开。",
      cards: [
        {
          title: "memex watch --daemon --heal",
          label: "进阶 · 按需",
          description:
            "长驻后台循环：ingest → lint → ingest，直到 wiki issue 归零。方便，但会自主消耗 agent token。先用前台的 memex watch --once 试跑，确信循环可控再后台化。",
          code: `memex watch --once
memex watch --daemon --heal`,
        },
        {
          title: "memex context install",
          label: "进阶 · 按需",
          description:
            "把带 marker 的「vault 摘要」写进 CLAUDE.md / AGENTS.md / .cursor/rules/memex.mdc，让每次新起 agent 会话就带上 vault 位置与 scene 摘要。",
          code: `memex context install
memex context refresh
memex context status`,
        },
      ],
    },
  },
  architecture: {
    sectionTitle: "架构",
    sectionSubtitle:
      "三层清晰分离。CLI 不调用大模型 API —— 只构造上下文并交给你的 agent。",
    diagramAlt: "ai-memex-cli 架构示意图",
    layers: [
      {
        label: "第 3 层 — AI 智能体",
        desc: "Claude Code、Codex、Cursor、OpenCode、Gemini CLI、Aider、Continue.dev",
      },
      {
        label: "第 2 层 — ai-memex-cli",
        desc:
          "无状态原语：onboard · fetch · ingest · distill · watch · context · glob · inject · lint · search · update",
      },
      {
        label: "第 1 层 — Vault（文件系统）",
        desc: "~/.llmwiki/global/（个人）+ .llmwiki/local/（项目）",
      },
    ],
    flowLeft: "↕ shell + 提示词",
    flowRight: "↕ 文件系统",
    vaultTitle: "Vault 结构",
    vaultIntro:
      "双 Vault：全局用于个人复利知识，本地用于项目上下文。",
    vaultTree: [
      { indent: 0, text: "~/.llmwiki/global/", highlight: true },
      { indent: 1, text: "AGENTS.md", note: "智能体说明（wiki 宪法）" },
      { indent: 1, text: "index.md", note: "Wiki 索引" },
      { indent: 1, text: "log.md", note: "时间线日志" },
      { indent: 1, text: "config.yaml", note: "Vault 配置" },
      { indent: 1, text: "raw/", highlight: true },
      { indent: 2, text: "research/", note: "抓取的文档与文章" },
      { indent: 2, text: "personal/", note: "个人笔记" },
      { indent: 2, text: "reading/", note: "阅读材料" },
      { indent: 2, text: "team/", note: "团队共享知识" },
      { indent: 3, text: "sessions/", note: "distill 默认输出的结构化会话 md" },
      { indent: 1, text: "wiki/", highlight: true },
      { indent: 2, text: "research/" },
      { indent: 3, text: "entities/", note: "人物、工具、组织" },
      { indent: 3, text: "concepts/", note: "思想与模式" },
      { indent: 3, text: "sources/", note: "引用与来源" },
      { indent: 3, text: "summaries/", note: "综合概览" },
    ],
    principleTitle: "核心设计原则",
    principleLead: "CLI 对",
    principleStrong: "大模型 API",
    principleTail:
      "采取零调用。它负责机械正确性（目录结构、frontmatter、校验、抓取），你的 AI 智能体负责语义正确性（阅读、综合、链接）。",
  },
  commands: {
    sectionTitle: "命令参考",
    sectionSubtitle:
      "18 条命令覆盖全流程 —— 从抓取与 ingest、会话蒸馏、wiki 健康检查，到在 agent 中安装斜杠命令。",
    coreTab: (n: number) => `核心命令（${n}）`,
    utilTab: (n: number) => `工具命令（${n}）`,
    options: "选项",
    core: {
      onboard: {
        desc: "交互式向导：选择智能体、检测会话目录、初始化 Vault、安装钩子。",
        usage: "memex onboard\nmemex onboard --agent claude-code -y",
        flags: [
          "--agent <name>  指定智能体（跳过选择）",
          "-y  非交互模式",
        ],
      },
      fetch: {
        desc: "抓取 URL、爬取站点地图或按关键词搜索 —— 以干净 Markdown 保存到 raw/。",
        usage:
          'memex fetch https://react.dev/reference/react/hooks\nmemex fetch "react hooks best practices" --top 5\nmemex fetch https://nextjs.org/sitemap.xml --sitemap',
        flags: [
          "--depth <n>     递归爬取深度",
          "--sitemap       通过 sitemap.xml 爬取",
          "--max-pages <n> 最多爬取页数",
          "--top <n>       关键词结果条数上限",
          "--yes           自动抓取全部结果",
          "--agent <name>  委托给智能体",
          "--scene <name>  目标场景目录",
        ],
      },
      ingest: {
        desc: "编排智能体将 raw 源处理为结构化 Wiki 页。",
        usage: "memex ingest\nmemex ingest raw/personal\nmemex ingest --agent codex --dry-run",
        flags: ["--agent <name>  指定智能体", "--dry-run       仅预览提示词"],
      },
      distill: {
        desc: "批量把所有 agent 会话转成结构化 Markdown，写入 raw/<scene>/sessions/，等待再次 ingest。",
        usage:
          "memex distill\nmemex distill --scene personal\nmemex distill --no-llm\nmemex distill ./chat-log.jsonl",
        flags: [
          "--scene <name>  目标 scene 目录（默认 team）",
          "--agent <name>  指定智能体的会话来源",
          "--no-llm        跳过可选的 LLM 摘要步骤",
          "--dry-run       仅预览提示词",
        ],
      },
      watch: {
        desc: "后台自愈循环：ingest → lint → ingest。由 raw/ 变更与/或周期性健康检查触发。有倾向性且会消耗 agent token。",
        usage:
          "memex watch --once\nmemex watch --daemon --heal\nmemex watch --follow\nmemex watch --status",
        flags: [
          "--once           单次 ingest + lint 后退出",
          "--daemon         后台驻留",
          "--heal           周期性 lint 驱动修复",
          "--heal-interval  重新 lint 间隔（默认 30m）",
          "--max-iter <n>   循环次数上限（0 = 无限）",
          "--force          绕过「无进展」守卫",
          "--follow / -f    跟踪 .llmwiki/watch.log",
          "--status         读取实时快照（watch.status.json）",
        ],
      },
      glob: {
        desc: "将相关全局 Wiki 页投影到项目本地 Vault。",
        usage: "memex glob --project ./my-app",
        flags: ["--project <dir>  目标项目目录"],
      },
      inject: {
        desc: "输出拼接后的 Wiki 上下文供智能体消费。",
        usage: "memex inject\nmemex inject --format json",
        flags: ["--format <fmt>  输出格式（text/json）"],
      },
      search: {
        desc: "对 Wiki 与 raw 全文搜索并相关性排序。",
        usage: 'memex search "authentication"\nmemex search "react hooks" --limit 10',
        flags: ["--limit <n>  最多结果数"],
      },
      lint: {
        desc: "扫描 Wiki 健康度：孤儿页、断链、缺失 frontmatter。",
        usage: "memex lint\nmemex lint --fix",
        flags: ["--fix  自动修复简单问题"],
      },
    },
    util: {
      init: {
        desc: "手动初始化新 Vault。",
        usage: "memex init\nmemex init --global",
        flags: ["--global  初始化全局 Vault"],
      },
      new: {
        desc: "从模板脚手架新建 Wiki 页。",
        usage: 'memex new concept "React Hooks"\nmemex new entity "Anthropic"',
        flags: ["<type>  entity | concept | source | summary", "<name>  页面名称"],
      },
      log: {
        desc: "向按时间排序的 log.md 追加格式化条目。",
        usage: 'memex log "Refactored auth module"',
        flags: [],
      },
      status: {
        desc: "查看 Vault 概览与统计。",
        usage: "memex status\nmemex status --json",
        flags: ["--json  以 JSON 输出"],
      },
      "link-check": {
        desc: "校验所有页面中的 [[wikilinks]]。",
        usage: "memex link-check",
        flags: [],
      },
      context: {
        desc: "把带 marker 的 vault 摘要（L0）写入 CLAUDE.md / AGENTS.md / .cursor/rules，让新会话自带 vault 位置与 scene 摘要。",
        usage:
          "memex context install\nmemex context refresh\nmemex context status\nmemex context uninstall",
        flags: [
          "install         写入 L0 摘要块",
          "refresh         重新生成摘要（已注册项目）",
          "status          显示注册项目与上次刷新",
          "uninstall       移除 L0 块",
        ],
      },
      "install-hooks": {
        desc: "为智能体生成原生 /memex:* 斜杠命令（Claude Code、Codex、OpenCode、Cursor、Gemini CLI、Aider、Continue.dev）。",
        usage:
          "memex install-hooks\nmemex install-hooks --agent cursor\nmemex install-hooks --no-context",
        flags: [
          "--agent <name>  目标智能体（跳过检测）",
          "--no-context    不安装 L0 上下文块",
          "--context-mode  控制 L0 插入行为",
        ],
      },
      config: {
        desc: "管理 CLI 配置与默认智能体。",
        usage: "memex config list\nmemex config set agent codex\nmemex config agents",
        flags: [
          "set <key> <val>  设置配置项",
          "get <key>        读取配置项",
          "list             显示全部配置",
          "agents           列出支持的智能体",
        ],
      },
      update: {
        desc: "自更新到最新版本。",
        usage: "memex update\nmemex update --check\nmemex update --source github",
        flags: [
          "--check          仅检查更新",
          "--source <src>   强制 npm 或 github 源",
        ],
      },
    },
  },
  comparison: {
    sectionTitle: "横向对比",
    sectionSubtitle:
      "与 README 中表格一致：侧重无状态 CLI、通用 agent、零 API 成本与原生集成。",
    colFeature: "特性",
    colThisProject: "本项目",
    thisProjectBadge: "★ 本项目",
    rows: [
      {
        feature: "架构",
        values: [
          "无状态 CLI + Agent Prompt",
          "独立 CLI（直接调 LLM API）",
          "Claude Code 插件",
          "纯 Markdown Prompt",
          "TypeScript MCP Server",
        ],
      },
      {
        feature: "Agent 支持",
        values: [
          "通用（8+ 个 agent）",
          "仅 Anthropic API",
          "仅 Claude Code",
          "仅 Claude Code",
          "仅 MCP 兼容",
        ],
      },
      {
        feature: "网页抓取",
        values: [
          "内置爬虫 + 关键词搜索",
          "单 URL 导入",
          "无",
          "无",
          "无",
        ],
      },
      {
        feature: "会话蒸馏",
        values: [
          "支持（批量、结构化 MD）",
          "无",
          "无",
          "无",
          "支持（后台）",
        ],
      },
      {
        feature: "斜杠命令",
        values: [
          "为全部 agent 自动生成",
          "无",
          "内置（插件）",
          "手动配置",
          "不适用",
        ],
      },
      {
        feature: "交互式引导",
        values: ["支持（向导）", "无", "无", "无", "无"],
      },
      {
        feature: "自更新",
        values: ["支持（memex update）", "无", "无", "无", "无"],
      },
      {
        feature: "成本",
        values: [
          "免费（用 agent 会话）",
          "需要 API Key",
          "免费（用 Claude 会话）",
          "免费",
          "需要 API Key",
        ],
      },
    ],
    footnote:
      "对比基于截至 2026 年 4 月的公开文档。atomicmemory/llm-wiki-compiler、ussumant/llm-wiki-compiler、SamurAIGPT/llm-wiki-agent、rohitg00/agentmemory。",
  },
  quickStart: {
    sectionTitle: "快速开始",
    sectionSubtitle: "约 5 分钟内从零到可用的知识库。",
    steps: [
      {
        number: "01",
        title: "安装",
        description: "通过 npm 全局安装。CLI 提供 memex 与 ai-memex 两个别名。",
        code: `npm install -g ai-memex-cli\nmemex --version`,
      },
      {
        number: "02",
        title: "引导",
        description:
          "运行交互式向导：检测 AI 智能体、初始化 Vault、安装斜杠命令。",
        code: `memex onboard\n# → Choose agent: Claude Code\n# → Session dir: ~/.claude/projects/\n# → Vault initialized at ~/.llmwiki/global/\n# → Slash commands installed`,
      },
      {
        number: "03",
        title: "抓取知识",
        description: "从 URL 抓取文档或按关键词搜索。均以干净 Markdown 保存到 raw/。",
        code: `memex fetch https://react.dev/reference/react/hooks\nmemex fetch "typescript generics tutorial" --top 3`,
      },
      {
        number: "04",
        title: "摄入与蒸馏",
        description:
          "先把全部会话蒸馏为 raw/<scene>/sessions/ 下的结构化 Markdown，再让 agent 执行 ingest，把 raw/ 整合进 wiki/。需要时再考虑 watch/context 等进阶能力。",
        code: `memex distill\nmemex ingest\n# 可选：memex watch --once`,
      },
      {
        number: "05",
        title: "搜索与使用",
        description: "搜索知识库、健康检查，并按需把 wiki 上下文注入 agent。",
        code: `memex search "authentication patterns"\nmemex lint\nmemex inject`,
      },
    ],
    cta: "在 GitHub 查看完整文档",
  },
  footer: {
    tagline:
      "Karpathy LLM Wiki pattern 的日常工作流：持久 Markdown 知识库，由你的 agent 维护。",
    navTitle: "导航",
    agentsTitle: "支持的智能体",
    resourcesTitle: "资源",
    githubRepo: "GitHub 仓库",
    npmPackage: "npm 包",
    karpathyGist: "Karpathy LLM Wiki Gist",
    license: "MIT 许可证 © 2026。为 AI 智能体生态用心构建。",
    version: "v0.1.5",
  },
  notFound: {
    title: "页面未找到",
    body: "抱歉，您访问的页面不存在。",
    body2: "可能已被移动或删除。",
    goHome: "返回首页",
  },
  manusDialog: {
    description: "请使用 Manus 登录以继续",
    login: "使用 Manus 登录",
  },
};

export type AppMessages = typeof zhCN;
