/**
 * 网站默认文案（简体中文）。CLI 命令与代码块保持英文以便复制运行。
 */
export const zhCN = {
  meta: {
    title: "ai-memex-cli — 面向 AI 智能体的持久记忆",
    description:
      "构建持久化 LLM Wiki 的通用 CLI。兼容 Claude Code、Codex、OpenCode、Cursor 等。",
  },
  ui: {
    switchToZh: "中文",
    switchToEn: "English",
    languageSwitcherAria: "切换界面语言",
    styleTech: "科技",
    styleClassic: "经典",
    styleSegmentAria: "切换视觉风格（科技 / 经典）",
    themeLightAria: "切换到浅色模式",
    themeDarkAria: "切换到深色模式",
    themeToggleAria: "切换浅色 / 深色模式",
    menuPreferences: "偏好",
    menuStyle: "风格",
    menuLanguage: "语言",
    menuDark: "深色模式",
    menuOpenSettings: "打开偏好设置",
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
    badge: "受 Karpathy LLM Wiki 启发",
    titleLine1: "持久记忆",
    titleLine2: "面向 AI 智能体",
    subtitle:
      "通用 CLI：从原始文档与会话中构建结构化知识 Wiki。兼容 Claude Code、Codex、Cursor 等 5+ 种智能体。",
    copyTitle: "复制到剪贴板",
    copy: "复制",
    quickStart: "快速开始指南",
    viewGithub: "在 GitHub 上查看",
  },
  features: {
    sectionTitle: "核心能力",
    sectionSubtitle: "构建、维护并调用面向 AI 智能体的持久知识所需的一切。",
    blocks: [
      {
        title: "抓取与爬取",
        subtitle: "内置网页抓取",
        description:
          "从任意 URL 拉取文档、通过站点地图整站爬取，或按关键词搜索——均以干净 Markdown 存入 raw/。无需 API Key。",
        code: `memex fetch "react hooks best practices"\nmemex fetch https://docs.anthropic.com --depth 2\nmemex fetch https://nextjs.org/sitemap.xml --sitemap`,
      },
      {
        title: "会话蒸馏",
        subtitle: "结构化 + 可选 LLM 蒸馏",
        description:
          "无参数即可把 Claude Code / Codex / OpenCode 全部历史会话就地解析为结构化 Markdown（含时间戳、角色、工具调用折叠），写入 raw/team/sessions/。需要更深度的角色化总结时再交给智能体做二次蒸馏。不拷贝原始 JSONL。",
        code: `memex distill                               # 全部会话 → raw/team/sessions/*.md\nmemex distill --scene personal              # 改放个人 scene\nmemex distill --latest --role backend       # 可选：让智能体做角色蒸馏`,
      },
      {
        title: "通用智能体支持",
        subtitle: "一个 CLI，覆盖所有智能体",
        description:
          "兼容 Claude Code、Codex、OpenCode、Cursor、Gemini CLI、Aider、Continue.dev 等。一条 onboard 命令即可为所选智能体安装斜杠命令。",
        code: `memex onboard\n# → Choose agent → Auto-detect sessions\n# → Init vault → Install /memex:* commands`,
      },
    ],
    small: [
      {
        title: "智能搜索",
        description: "对 Wiki 与 raw 全文检索，支持关键词高亮与相关性排序。",
      },
      {
        title: "结构化 Wiki",
        description: "实体、概念、来源、摘要——均带 frontmatter 校验与交叉链接。",
      },
      {
        title: "进度可视与前置校验",
        description:
          "长任务（抓取 / 蒸馏 / ingest）自带进度条与旋转指示；未初始化 vault 或未选定智能体时，所有命令会友好报错并引导 memex onboard。",
      },
    ],
  },
  architecture: {
    sectionTitle: "架构",
    sectionSubtitle:
      "三层清晰分离。CLI 不调用大模型 API——只负责构造上下文并交给你的智能体。",
    diagramAlt: "ai-memex-cli 架构示意图",
    layers: [
      {
        label: "第 3 层 — AI 智能体",
        desc: "Claude Code、Codex、Cursor、OpenCode、Gemini CLI、Aider、Continue.dev",
      },
      {
        label: "第 2 层 — ai-memex-cli",
        desc: "无状态原语：onboard · fetch · ingest · distill · glob · inject · lint · search · update",
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
      "双 Vault 设计：全局用于个人复利知识，本地用于项目上下文。",
    vaultTree: [
      { indent: 0, text: "~/.llmwiki/global/", highlight: true },
      { indent: 1, text: "AGENTS.md", note: "智能体说明" },
      { indent: 1, text: "index.md", note: "Wiki 索引" },
      { indent: 1, text: "log.md", note: "时间线日志" },
      { indent: 1, text: "config.yaml", note: "Vault 配置" },
      { indent: 1, text: "raw/", highlight: true },
      { indent: 2, text: "research/", note: "抓取的文档与文章" },
      { indent: 2, text: "personal/", note: "个人笔记" },
      { indent: 2, text: "reading/", note: "阅读材料" },
      { indent: 2, text: "team/", note: "团队共享知识" },
      { indent: 3, text: "sessions/", note: "结构化会话 md（distill 默认输出）" },
      { indent: 1, text: "wiki/", highlight: true },
      { indent: 2, text: "research/" },
      { indent: 3, text: "entities/", note: "人物、工具、组织" },
      { indent: 3, text: "concepts/", note: "思想与模式" },
      { indent: 3, text: "sources/", note: "引用与来源" },
      { indent: 3, text: "summaries/", note: "综合概览" },
    ],
    principleTitle: "核心设计原则",
    principleBefore: "CLI 对",
    principleStrong: "大模型 API",
    principleAfter:
      "采取零调用。它负责机械正确性（目录结构、frontmatter、校验、抓取），你的 AI 智能体负责语义正确性（阅读、综合、链接）。",
  },
  commands: {
    sectionTitle: "命令参考",
    sectionSubtitle: "16 条命令覆盖知识管理全流程——从抓取到 Lint。",
    coreTab: (n: number) => `核心命令（${n}）`,
    utilTab: (n: number) => `工具命令（${n}）`,
    options: "选项",
    core: {
      onboard: {
        desc: "交互式向导：选择智能体、检测会话目录、初始化 Vault、安装钩子。",
        flags: [
          "--agent <name>  指定智能体（跳过选择）",
          "-y  非交互模式",
        ],
      },
      fetch: {
        desc: "抓取 URL、爬取站点地图或按关键词搜索——以干净 Markdown 保存到 raw/。",
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
        flags: ["--agent <name>  指定智能体", "--dry-run       仅预览提示词"],
      },
      distill: {
        desc: "无参：把全部原生会话结构化转为 Markdown 写入 raw/<scene>/sessions/（默认 team）；传入会话路径或 --latest 时，调用智能体做角色化蒸馏。",
        flags: [
          "--scene <name>  目标 scene 目录（默认 team）",
          "--latest        自动定位并蒸馏最近会话",
          "--role <role>   按角色筛选（需配合 LLM）",
          "--agent <name>  指定智能体",
          "--no-llm        机械模式，仅结构化转写",
          "--dry-run       仅预览提示词",
        ],
      },
      glob: {
        desc: "将相关全局 Wiki 页投影到项目本地 Vault。",
        flags: ["--project <dir>  目标项目目录"],
      },
      inject: {
        desc: "输出拼接后的 Wiki 上下文供智能体消费。",
        flags: ["--format <fmt>  输出格式（text/json）"],
      },
      search: {
        desc: "对 Wiki 与 raw 全文搜索并相关性排序。",
        flags: ["--limit <n>  最多结果数"],
      },
      lint: {
        desc: "扫描 Wiki 健康度：孤儿页、断链、缺失 frontmatter。",
        flags: ["--fix  自动修复简单问题"],
      },
    },
    util: {
      init: {
        desc: "手动初始化新 Vault。",
        flags: ["--global  初始化全局 Vault"],
      },
      new: {
        desc: "从模板脚手架新建 Wiki 页。",
        flags: ["<type>  entity | concept | source | summary", "<name>  页面名称"],
      },
      log: {
        desc: "向按时间排序的 log.md 追加格式化条目。",
        flags: [],
      },
      status: {
        desc: "查看 Vault 概览与统计。",
        flags: ["--json  以 JSON 输出"],
      },
      "link-check": {
        desc: "校验所有页面中的 [[wikilinks]]。",
        flags: [],
      },
      "install-hooks": {
        desc: "为智能体生成自定义斜杠命令。",
        flags: ["--agent <name>  目标智能体"],
      },
      config: {
        desc: "管理 CLI 配置与默认智能体。",
        flags: [
          "set <key> <val>  设置配置项",
          "get <key>        读取配置项",
          "list             显示全部配置",
          "agents           列出支持的智能体",
        ],
      },
      update: {
        desc: "自更新到最新版本。",
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
      "一览 LLM Wiki 生态。我们侧重通用性、零 API 成本与原生智能体集成。",
    colFeature: "能力",
    colThisProject: "本项目",
    thisProjectBadge: "★ 本项目",
    rows: [
      {
        feature: "架构",
        values: ["无状态 CLI", "CLI（调用 LLM）", "Claude 插件", "Markdown 提示", "MCP 服务"],
      },
      {
        feature: "智能体支持",
        values: ["8+ 种", "仅 Anthropic", "仅 Claude", "仅 Claude", "兼容 MCP"],
      },
      {
        feature: "网页抓取",
        values: ["yes", "partial", "no", "no", "no"],
      },
      {
        feature: "关键词搜索",
        values: ["yes", "no", "no", "no", "no"],
      },
      {
        feature: "会话蒸馏",
        values: ["yes", "no", "no", "no", "partial"],
      },
      {
        feature: "斜杠命令",
        values: ["yes", "no", "yes", "partial", "no"],
      },
      {
        feature: "交互式引导",
        values: ["yes", "no", "no", "no", "no"],
      },
      {
        feature: "自更新",
        values: ["yes", "no", "no", "no", "no"],
      },
      {
        feature: "零 API 费用",
        values: ["yes", "no", "yes", "yes", "no"],
      },
      {
        feature: "跨平台",
        values: ["yes", "partial", "partial", "partial", "yes"],
      },
    ],
    footnote:
      "对比基于截至 2026 年 4 月的公开文档。atomicmemory = llm-wiki-compiler (508★)，ussumant = llm-wiki-compiler (191★)，SamurAIGPT = llm-wiki-agent (1900+★)，rohitg00 = agentmemory (1600+★)。",
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
        description: "从 URL 抓取文档或按关键词搜索。均以干净 Markdown 保存。",
        code: `memex fetch https://react.dev/reference/react/hooks\nmemex fetch "typescript generics tutorial" --top 3`,
      },
      {
        number: "04",
        title: "摄入与蒸馏",
        description:
          "先用一条 distill 把全部会话转成结构化 md，再让智能体把 raw 整体 ingest 为 Wiki。需要角色化总结时再单独跑一次 --role。",
        code: `memex distill                 # 全部会话 → raw/team/sessions/*.md\nmemex ingest                  # 让智能体整理 raw/ → wiki/\nmemex distill --latest --role backend   # 可选：角色蒸馏`,
      },
      {
        number: "05",
        title: "搜索与使用",
        description: "搜索知识库、健康检查，并向智能体会话注入上下文。",
        code: `memex search "authentication patterns"\nmemex lint\nmemex inject`,
      },
    ],
    cta: "在 GitHub 查看完整文档",
  },
  footer: {
    tagline: "面向 AI 智能体的持久记忆。受 Karpathy LLM Wiki 模式启发。",
    navTitle: "导航",
    agentsTitle: "支持的智能体",
    resourcesTitle: "资源",
    githubRepo: "GitHub 仓库",
    npmPackage: "npm 包",
    karpathyGist: "Karpathy LLM Wiki Gist",
    license: "MIT 许可证 © 2026。为 AI 智能体生态用心构建。",
  },
  notFound: {
    title: "页面未找到",
    body: "抱歉，您访问的页面不存在。",
    body2: "可能已被移动或删除。",
    goHome: "返回首页",
  },
  errorBoundary: {
    title: "发生意外错误。",
    reload: "重新加载页面",
  },
  manusDialog: {
    description: "请使用 Manus 登录以继续",
    login: "使用 Manus 登录",
  },
};

/** 全站文案类型（宽 string，便于中英两套文案共用类型） */
export type AppMessages = typeof zhCN;
/** @deprecated 使用 AppMessages */
export type ZhCNMessages = AppMessages;
