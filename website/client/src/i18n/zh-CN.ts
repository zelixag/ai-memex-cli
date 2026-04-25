/**
 * 网站默认文案（简体中文）。CLI 命令与代码块保持英文以便复制运行。
 */
export const zhCN = {
  meta: {
    title: "ai-memex-cli — agent-native LLM wiki 工作流",
    description:
      "一个建立在 Karpathy LLM Wiki 思想之上的 agent-native 工作流，由 memex CLI 工具箱提供底层支撑。",
  },
  ui: {
    switchToZh: "中文",
    switchToEn: "English",
    languageToggleAria: "切换界面语言",
    themeToggleAria: "切换网站主题",
    themeDefault: "默认",
    themeMono: "黑白",
    themeTech: "科技",
  },
  navbar: {
    links: [
      { label: "特性", href: "#features" },
      { label: "场景", href: "#scenarios" },
      { label: "架构", href: "#architecture" },
      { label: "命令", href: "#commands" },
      { label: "对比", href: "#comparison" },
      { label: "快速开始", href: "#quickstart" },
    ],
    github: "GitHub",
    getStarted: "开始使用",
  },
  scenarios: {
    sectionTitle: "五个 agent 对话式知识工作流",
    sectionSubtitle:
      "memex 的日常入口应该在 agent 对话里。你告诉 agent 要 capture、query、distill、ingest 或 repair；CLI 只在背后承担确定性的机械工具。",
    readArticle: "阅读场景",
    backToScenarios: "返回场景列表",
    runIt: "在 agent 里这样说",
    articles: [
      {
        slug: "long-term-research",
        eyebrow: "长期研究",
        title: "长期研究一个主题：让知识库自己长起来",
        summary:
          "研究 agent memory、LLM wiki、RAG、Claude Code、OpenSpec 这类长期主题时，不再靠一次次临时聊天，而是让 agent 维护同一个 Git 化知识库。",
        command: `你：/memex:capture https://example.com/agent-memory-paper --scene research
你：/memex:ingest 新的研究资料，并更新 agent memory overview
你：/memex:query "我们已经知道 agent memory 和 RAG 的哪些差异？"`,
        body: [
          {
            heading: "怎么使用",
            text:
              "你始终留在 agent 对话里。看到文章、论文、repo、issue 或实验记录时，让 agent 先 capture 到 raw 源材料；积累一小批后，让 agent ingest，把材料合并进 source、concept、entity 和 summary 页面。",
            steps: [
              "把长期主题放进用户或公司主知识库，通常用 research scene 或 tags 组织。",
              "先让 agent 保存原始来源，再让它做判断，确保 raw 证据可追溯。",
              "每积累几份来源，让 agent ingest，并优先合并到已有页面。",
              "要求 agent 更新 index.md 和 log.md，写清楚本轮解决了什么、还缺什么。",
            ],
            code: `你：/memex:capture "agent memory design tradeoffs" --scene research
Agent：保存 raw 来源，并记录出处。
你：/memex:ingest，把它们整理进 source、concept 和 summary 页面。`,
          },
          {
            heading: "推荐节奏",
            text:
              "节奏是对话式的：先问知识库已经知道什么，再带着旧结论读新材料，最后让 agent 把稳定结论折回 wiki。用户不需要记住底层该跑哪个 CLI 命令。",
            steps: [
              "开始研究前，先让 agent 查询当前问题在 wiki 里已有的结论。",
              "只有当新材料提供证据、反例或好案例时，才 capture 进知识库。",
              "每周让 agent 更新一篇 overview summary，而不是堆一堆孤立总结。",
              "如果新证据改变旧判断，在 summary 里同时保留新旧来源。",
            ],
            code: `你：/memex:query "agent memory RAG tradeoff"
Agent：基于 wiki 回答，并指出证据缺口。
你：把这两篇新论文 capture 进去，然后更新 overview summary。`,
          },
          {
            heading: "知识库会维护什么",
            text:
              "最终得到的不是收藏夹，而是一张可链接、可引用、会更新的 Markdown 知识地图：关键概念、代表性项目、重要来源、阶段性判断和未解决问题都在里面。",
            steps: [
              "concepts/agent-memory.md 解释定义、边界和常见实现方式。",
              "summaries/agent-memory-vs-rag.md 维护阶段性对比和取舍。",
              "sources/* 保存每个来源的出处、主张、证据和局限。",
              "index.md 能作为这个主题的导航，而不是只靠文件夹浏览。",
            ],
            code: `Agent 维护：wiki/research/concepts/agent-memory.md
Agent 维护：wiki/research/summaries/agent-memory-vs-rag.md
Agent 维护：index.md 和 log.md`,
          },
        ],
      },
      {
        slug: "long-term-project",
        eyebrow: "长期项目",
        title: "长期维护一个项目：让项目记忆可继承",
        summary:
          "像 ai-memex-cli 这样的持续迭代项目，不应该让每个新 agent 重新理解架构决策、命令边界、坑、用户反馈和 roadmap。",
        command: `你：先扫描这个 repo，基于当前代码生成项目知识草稿，不要复制整仓代码。
你：/memex:ingest 这次代码阅读结论、已有 docs、issue 和对话沉淀。
你：以后改代码前先 /memex:query 项目记忆，改完再 /memex:distill。`,
        body: [
          {
            heading: "怎么使用",
            text:
              "主知识库是用户或公司的 canonical repo。项目仓库默认只是连接到主知识库，通过安装好的 agent context 和相关 scene 引用它。代码仓库本身仍然是最新事实来源，memex 负责保存 agent 从代码、文档、issue、PR、用户反馈和会话里提炼出的长期项目知识。",
            steps: [
              "第一次 onboard 或 install 后，让所选 agent 都知道主 memex vault 在哪里。",
              "第一次接入项目时，让 agent 实时读取当前 repo 的 README、docs、配置、入口文件和核心模块，生成项目知识草稿。",
              "日常任务开始时，让 agent 先 query 项目记忆，再按需读取最新源码验证。",
              "完成重要实现、排障或定位调整后，让 agent distill 当前会话，并把稳定结论 ingest 回项目页面。",
            ],
            code: `你：把这个 repo 连接到我的主 memex 知识库。
Agent：安装项目/用户级上下文，并记录相关 scenes。
你：读取当前代码和 docs，生成 architecture、command-design 和 testing-contracts 草稿。`,
          },
          {
            heading: "项目知识从哪里来",
            text:
              "不要把整个代码库复制进 raw。代码已经在 Git repo 里，是实时读取的 source of truth。raw 更适合保存外部资料、issue/PR 摘要、用户反馈、会话蒸馏，以及 agent 针对某次代码阅读生成的带路径和 commit 的观察记录。wiki 保存的是稳定理解，不保存源码镜像。",
            steps: [
              "当前代码：agent 在任务中直接读最新文件，并在 wiki 里引用文件路径、模块名和必要的 commit，而不是复制源码。",
              "项目文档：README、docs、ADR、release notes 可以 capture 或由 agent 摘要后进入 raw/source。",
              "协作材料：issue、PR、用户反馈、roadmap 讨论可以作为 raw source，再由 agent ingest。",
              "会话沉淀：重要设计、排障路径、取舍和下一步计划通过 distill 进入 raw/sessions。",
            ],
            code: `你：先读 src/commands、src/core 和 tests，做一份项目结构地图。
Agent：实时读取当前代码，输出带文件路径的 code-reading source。
你：把这份 code-reading source ingest 成 wiki，不要拷贝源码全文。`,
          },
          {
            heading: "推荐页面",
            text:
              "agent 应该维护解释项目为什么这样设计、当前代码结构如何组织、哪些约定必须保留的页面。目标不是再存一堆聊天记录，也不是复制代码，而是让下一次会话能读到少量可靠页面，再去读最新源码。",
            steps: [
              "architecture-decisions：为什么选 CLI + agent、为什么 CLI 不直接写语义内容。",
              "command-design：每个命令的职责边界、输入输出和调用关系。",
              "code-map：当前核心目录、入口、模块关系和测试位置，引用路径但不复制代码。",
              "known-pitfalls：Windows 路径、sandbox、agent 命令不可用时的 fallback。",
              "testing-contracts：新增或修改命令时必须保护哪些行为。",
            ],
            code: `你：/memex:ingest 当前 code-reading source 和会话结论到项目架构笔记。
Agent：更新已有 decision、code-map 和 command-design 页面。
你：把这次改变 roadmap 的用户反馈也写入 log。`,
          },
          {
            heading: "最终效果",
            text:
              "项目知识从散在聊天和 commit 里，变成可传承的 Markdown 记忆。几天后切回项目，agent 能知道之前为什么这么设计、哪些方案已经否掉、哪些测试约束不能破坏。",
            steps: [
              "新 agent 会先查询当前任务的项目记忆，再读源码。",
              "agent 能说明已有设计原因，而不是重新推导历史。",
              "用户反馈和 roadmap 有链接，不散在聊天里。",
              "log.md 能看到最近几轮迭代和决策。",
            ],
            code: `你：/memex:query "继续 ai-memex-cli website 和 CLI docs 工作"
Agent：返回相关项目页面和最近 handoff。
你：按这些 notes 继续，完成后更新 wiki。`,
          },
        ],
      },
      {
        slug: "cross-agent-continuity",
        eyebrow: "跨会话继承",
        title: "多次 agent 会话之间继承上下文",
        summary:
          "今天 Claude 做了一半，明天 Codex 继续，后天 Cursor 再检查。连续性应该存在 wiki 里，而不是绑定某一个供应商的聊天历史。",
        command: `你：/memex:distill 当前 Codex 会话，作为 handoff
你：/memex:ingest 这份 handoff 到项目记忆
你：/memex:query "继续未完成的网站场景文案重写"`,
        body: [
          {
            heading: "怎么使用",
            text:
              "当用户选择了多个 agent，memex 会记录对应的会话目录和提示入口。你在当前 agent 里让它 distill 当前会话、ingest 稳定信息，并写好另一个 agent 能接手的 handoff。",
            steps: [
              "长会话结束前，让当前 agent distill 这轮对话。",
              "让 agent ingest 这份 session source，更新项目 summary 和 log.md。",
              "明确写出 next actions：下一次从哪里继续、哪些文件动过、哪些验证没跑。",
              "如果任务中断，记录 blocker 和假设，避免下个 agent 重新猜。",
            ],
            code: `你：/memex:distill 当前会话，包含 next actions 和 blockers。
Agent：自动定位当前 agent session，写入 raw session source。
你：把这份 handoff ingest 到项目记忆。`,
          },
          {
            heading: "跨 agent 怎么用",
            text:
              "Claude、Codex、OpenCode、Cursor、Gemini 不需要共享同一个聊天窗口。它们共享的是 raw/、wiki/、index.md 和 log.md。一个 agent 把知识写进去，另一个 agent 从里面读出来。",
            steps: [
              "onboard 用户想使用的所有 agent，让 prompts、skills 和 session 目录都配置好。",
              "结束工作的 agent 负责 distill + ingest，把关键结论落进共享知识库。",
              "接手的 agent 先 query 当前任务，再继续实现。",
              "lint 和 link-check 保证多个 agent 修改后结构仍然可用。",
            ],
            code: `你：为 Claude Code、Codex 和 Cursor 配置这个 memex vault。
Agent：安装各自支持的 slash prompt 或 skill，并记录 session 目录。
你：/memex:query "resume interrupted work"`,
          },
          {
            heading: "最终效果",
            text:
              "上下文不再依赖某个特定供应商的会话历史。换 agent、换模型、隔几天回来，都能从同一个 durable Markdown wiki 恢复任务状态。",
            steps: [
              "每次 handoff 都能在 log.md 看到记录。",
              "未完成任务有明确 next actions。",
              "新 agent 的第一轮回答能引用已有 wiki 页面。",
              "不会因为换工具或隔几天回来而丢失上下文。",
            ],
            code: `你：/memex:query "next actions blocker handoff"
Agent：展示最近 handoff 页面和未完成事项。
你：从列出的下一步继续。`,
          },
        ],
      },
      {
        slug: "distill-good-conclusions",
        eyebrow: "对话沉淀",
        title: "把聊天中的好结论沉淀下来",
        summary:
          "一次对话里讨论清楚了定位、设计、tradeoff 或 bug 根因，就让 agent distill，并把稳定结论合并进 wiki。",
        command: `你：/memex:distill 这次对话，因为我们澄清了产品定位
你：/memex:ingest，但只把稳定结论合并到已有页面
你：/memex:query "positioning tradeoff rejected alternatives"`,
        body: [
          {
            heading: "怎么使用",
            text:
              "当一段聊天产生了真正的结论，继续留在聊天里让 agent 保存它。会话先成为可追溯 source material，再把稳定结论合并进 concept、summary 或 project page。",
            steps: [
              "上下文还新鲜时，让 agent distill 当前对话。",
              "让 agent 读取这份 session source，只提取未来会复用的稳定结论。",
              "把结论合并进已有页面，而不是总是新建页面。",
              "保留会话 source 链接，之后能追溯为什么当时这样判断。",
            ],
            code: `你：/memex:distill 这段讨论，作为 product-positioning source material。
Agent：保存上下文、决策和未解决问题。
你：ingest 它；如果已有定位页面，就合并进去。`,
          },
          {
            heading: "哪些结论值得沉淀",
            text:
              "产品定位、架构边界、为什么不用某方案、bug 根因、测试契约、用户反馈解读、命令命名、文案策略。这些结论未来会被重复用到，值得进入 wiki。",
            steps: [
              "产品定位：一句话怎么讲，哪些文案不要再用。",
              "架构边界：为什么 CLI 只做机械层，语义交给 agent。",
              "bug 根因：定位路径、真正原因、回归测试。",
              "用户反馈：用户为什么觉得不对，后续功能或网站如何调整。",
            ],
            code: `你：/memex:query "positioning architecture tradeoff bug root cause"
Agent：先找已有页面，再决定怎么写。
你：把今天的结论补进去，但不要重复建页。`,
          },
          {
            heading: "最终效果",
            text:
              "聊天不再是一次性消耗品。重要推理先作为 source 保存，再被 agent 提炼到结构化知识页里。以后 query 时能找到结论，也能追溯当时为什么这么判断。",
            steps: [
              "结论在 summary/concept 页可读，不藏在聊天全文里。",
              "source 页保留原始会话材料。",
              "重要 tradeoff 有 rejected alternatives。",
              "后来改变判断时，wiki 能记录原因和新来源。",
            ],
            code: `你：/memex:query "rejected alternatives"
Agent：基于维护过的 wiki 回答，并引用 source 页面。
你：如果今天的结论改变旧判断，就更新那一页。`,
          },
        ],
      },
      {
        slug: "ai-maintained-structured-knowledge",
        eyebrow: "结构化维护",
        title: "让 AI 维护结构化知识，而不是只回答一次",
        summary:
          "目标不是问一次答一次，而是让 agent 持续维护 entities、concepts、sources、summaries、index、log，让知识被更新、链接、合并、校验。",
        command: `你：/memex:status
你：/memex:repair 修复断链和 stale frontmatter，语义合并前先问我
你：/memex:query "open questions stale pages duplicate concepts"`,
        body: [
          {
            heading: "怎么使用",
            text:
              "把 agent 当成 wiki maintainer，而不是问答机器人。你用自然语言或 slash prompt 让它 capture、ingest、query、distill、repair、status；agent 再决定背后调用哪些 memex 机械原语。",
            steps: [
              "新增来源时，agent 更新 source 页面并链接相关 concepts/entities。",
              "概念变清楚时，agent 更新 concept 页面定义、边界和例子。",
              "多个来源形成阶段性判断时，agent 更新 summary 页面。",
              "每次重要维护动作写 log，让未来能追踪演化。",
            ],
            code: `你：把 Karpathy 的 LLM Wiki gist 加进知识库。
Agent：capture 来源，创建或更新相关 concept 页面，并写 log。
你：告诉我改了什么，还有哪些需要 review。`,
          },
          {
            heading: "CLI 和 agent 的边界",
            text:
              "CLI 负责机械正确性：路径、frontmatter、断链、搜索、模板、状态、session 解析。agent 负责语义正确性：哪些页面该更新、哪些概念该链接、哪些矛盾要保留、哪些 summary 需要重写。",
            steps: [
              "CLI 处理确定性的文件和校验工作。",
              "agent 判断应该写什么、链接什么、合并什么、保留什么矛盾。",
              "用户给 schema 和质量标准，比如哪些页面类型必须有来源。",
              "复杂 repair 前，agent 应先展示计划，再做大范围语义编辑。",
            ],
            code: `你：/memex:repair 知识库结构。
Agent：运行 lint/link 检查，提出语义修复计划，并在高风险合并前询问。
你：应用机械修复，不确定的事实先留待 review。`,
          },
          {
            heading: "最终效果",
            text:
              "知识库不只是存档，而是一个持续维护的结构化系统。每次 agent 使用它，也在改进它；每次 repair，又让它保持可读、可链接、可追溯。",
            steps: [
              "新增 source 会带动已有 concept/summary 更新。",
              "重复页面会被合并或标记。",
              "孤儿页和断链能被定期发现。",
              "index.md 能作为整库导航，而不是摆设。",
            ],
            code: `你：/memex:status
Agent：报告 vault 健康度、最近来源、stale 页面和下一步维护动作。
你：执行安全修复，并总结剩余风险。`,
          },
        ],
      },
    ],
  },
  hero: {
    imgAlt: "知识制图工作台",
    badge: "Karpathy LLM Wiki × agent-native",
    titleLine1: "让 agent 构建并使用",
    titleLine2: "你的 LLM wiki",
    subtitle:
      "基于 Karpathy 的 LLM Wiki 思想，但日常入口是你的 AI agent：skill 判断何时 capture、ingest、query、distill、repair；memex CLI 作为底层设施，负责 raw 源材料、搜索、Lint、链接校验、session 解析和安装配置。",
    copyTitle: "复制到剪贴板",
    copy: "复制",
    quickStart: "快速开始指南",
    viewGithub: "在 GitHub 上查看",
  },
  features: {
    sectionTitle: "核心管线",
    sectionSubtitle:
      "agent 负责管理和使用知识库；CLI 负责稳定、可脚本化、可审计的底层机械原语。",
    blocks: [
      {
        title: "构建 wiki",
        subtitle: "Karpathy 思想的工程化落地",
        description:
          "memex fetch 把原始资料放进 raw/（URL、站点地图、DuckDuckGo 关键词搜索或委托 agent 抓取）。memex ingest 再把 raw/ 交给 agent，让它把新材料整合进 wiki/ —— 一次性更新 entity / concept 页面、索引与日志。交叉引用已经在那里。",
        code: `memex fetch "react hooks best practices" --top 5
memex fetch https://nextjs.org/sitemap.xml --sitemap
memex ingest`,
      },
      {
        title: "蒸馏会话",
        subtitle: "把有价值的会话沉淀为 raw 材料",
        description:
          "「好的回答应该被归档回 wiki 作为新页面。」memex distill 把你用过的所有 agent 会话批量转成结构化 Markdown，落在 raw/<scene>/sessions/，等待再次 ingest。这是让昨天啃过的难题，能照亮明天提问的机制。",
        code: `memex distill
memex distill --scene personal
memex distill --no-llm`,
      },
      {
        title: "一个 CLI，覆盖所有 agent",
        subtitle: "CLI 是底层设施 —— agent 是主界面",
        description:
          "兼容 Claude Code、Codex、OpenCode、Cursor、Gemini CLI、Aider、Continue.dev 与通用 CLI agent。memex 本身不调用任何大模型 API —— 只编排文件与 prompt；真正的推理在你本地 agent 的会话里。wiki 是纯 Markdown，可 git diff / blame。",
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
          "memex lint / memex link-check 标记孤儿页、断裂的 [[wikilink]]、缺失 frontmatter 与可疑交叉引用；复杂修复交给 agent 审阅后执行。",
      },
      {
        title: "你拥有的 schema",
        description:
          "AGENTS.md 是 wiki 的「宪法」，由你与 LLM 协同演化。memex init 给默认可用版本；按你的领域去改。",
      },
    ],
    advanced: {
      kicker: "进阶自动化 —— 有倾向性，按需启用",
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
            "把带 marker 的「vault 摘要」写进当前 agent 的宿主文件（CLAUDE.md、AGENTS.md、GEMINI.md 或 .cursor/rules/memex.mdc），让每次新起 agent 会话就带上 vault 位置与 scene 摘要。",
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
        desc: "Claude Code、Codex、Cursor、OpenCode、Gemini CLI、Aider、Continue.dev、Generic",
      },
      {
        label: "第 2 层 — ai-memex-cli",
        desc:
          "无状态原语：onboard · init · fetch · ingest · distill · watch · context · glob · inject · search · lint · link-check · config · update",
      },
      {
        label: "第 1 层 — Vault（文件系统）",
        desc: "~/.llmwiki/（个人）+ .llmwiki/local/（项目）",
      },
    ],
    flowLeft: "↕ shell + 提示词",
    flowRight: "↕ 文件系统",
    vaultTitle: "Vault 结构",
    vaultIntro:
      "双 Vault：全局用于长期知识，本地用于项目上下文。",
    vaultTree: [
      { indent: 0, text: "~/.llmwiki/", highlight: true },
      { indent: 1, text: "AGENTS.md", note: "智能体说明（wiki 宪法）" },
      { indent: 1, text: "index.md", note: "Wiki 索引" },
      { indent: 1, text: "log.md", note: "时间线日志" },
      { indent: 1, text: "config.json", note: "Vault 配置" },
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
          "--heal-interval  重新 lint 间隔，单位 ms（默认 60000）",
          "--max-iter <n>   循环次数上限（0 = 无限）",
          "--force          绕过「无进展」守卫",
          "--follow / -f    跟踪 .llmwiki/watch.log",
          "--status         读取实时快照（watch.status.json）",
        ],
      },
      glob: {
        desc: "将相关全局 Wiki 页投影到项目本地 Vault。",
        usage: "memex glob --project ./my-app\nmemex glob --keywords react,hooks --max 20",
        flags: [
          "--project <dir>  目标项目目录",
          "--keywords <kw>  逗号分隔关键词",
          "--max <n>        最多投影页数",
        ],
      },
      inject: {
        desc: "输出拼接后的 Wiki 上下文供智能体消费。",
        usage: 'memex inject --task "implement authentication"\nmemex inject --format json',
        flags: [
          "--task <text>    用于相关性筛选的任务描述",
          "--keywords <kw>  逗号分隔关键词",
          "--format <fmt>   输出格式（md/json）",
          "--max-tokens <n> Token 预算",
        ],
      },
      search: {
        desc: "对 Wiki 与 raw 全文搜索并相关性排序。",
        usage: 'memex search "authentication"\nmemex search "react hooks" --limit 10 --json',
        flags: [
          "--scene <name>       按 scene 过滤",
          "--type <type>        按页面类型过滤",
          "--engine <engine>    ripgrep、qmd 或 hybrid",
          "--json              输出 JSON",
          "--limit <n>          最多结果数",
          "--no-include-raw     只搜索 wiki/",
        ],
      },
      lint: {
        desc: "扫描 Wiki 健康度：孤儿页、断链、缺失 frontmatter。",
        usage: "memex lint\nmemex lint --json\nmemex lint --check frontmatter,links",
        flags: [
          "--scene <name>   按 scene 过滤",
          "--check <list>   逗号分隔检查项",
          "--json           输出 JSON",
        ],
      },
    },
    util: {
      init: {
        desc: "手动初始化新 Vault。",
        usage: "memex init\nmemex init --scope local --scene research,team\nmemex init --agent codex",
        flags: [
          "--scope <scope>  global 或 local",
          "--scene <list>   逗号分隔 scene",
          "--agent <id>     全局 Vault 的 schema 文件对应 agent",
        ],
      },
      new: {
        desc: "从模板脚手架新建 Wiki 页。",
        usage: 'memex new concept "React Hooks"\nmemex new entity "Anthropic"',
        flags: ["<type>  entity | concept | source | summary", "<name>  页面名称"],
      },
      log: {
        desc: "向按时间排序的 log.md 追加格式化条目。",
        usage: 'memex log decision --target auth --note "Chose PKCE"',
        flags: [
          "--target <name>  目标页面或主题",
          "--note <text>    备注文本",
        ],
      },
      status: {
        desc: "查看 Vault 概览与统计。",
        usage: "memex status\nmemex status --vault ~/.llmwiki",
        flags: ["--vault <path>  Vault 路径"],
      },
      "link-check": {
        desc: "校验所有页面中的 [[wikilinks]]。",
        usage: "memex link-check\nmemex link-check --fix",
        flags: [
          "--fix           建议修复",
          "--vault <path>  Vault 路径",
        ],
      },
      context: {
        desc: "把带 marker 的 vault 摘要（L0）写入 agent 宿主文件，让新会话自带 vault 位置与 scene 摘要。",
        usage:
          "memex context install\nmemex context install --agent claude-code,codex\nmemex context refresh --all\nmemex context status\nmemex context uninstall",
        flags: [
          "install         写入 L0 摘要块",
          "refresh         重新生成摘要（已注册项目）",
          "status          显示注册项目与上次刷新",
          "uninstall       移除 L0 块",
          "--scene <list>  绑定 wiki scene",
          "--mode <mode>   minimal 或 digest",
        ],
      },
      "install-hooks": {
        desc: "为支持的智能体生成原生 /memex:* 斜杠命令或 agent 规则（Claude Code、Codex、OpenCode、Cursor、Gemini CLI、generic）。",
        usage:
          "memex install-hooks\nmemex install-hooks --agent codex --scope user\nmemex install-hooks --agent cursor --no-context",
        flags: [
          "--agent <name>  目标智能体（跳过检测）",
          "--scope <scope> project 或 user",
          "--project <dir> 项目目录",
          "--no-context    不安装 L0 上下文块",
          "--context-mode  minimal 或 digest",
          "--dry-run       仅预览文件",
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
        code: `memex onboard\n# → Choose agent: Claude Code\n# → Session dir: ~/.claude/projects/\n# → Vault initialized at ~/.llmwiki/\n# → Slash commands installed`,
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
      "基于 Karpathy LLM Wiki 思想的 agent-native 工作流：CLI 提供底层设施，agent 负责管理和使用知识库。",
    navTitle: "导航",
    agentsTitle: "支持的智能体",
    resourcesTitle: "资源",
    githubRepo: "GitHub 仓库",
    npmPackage: "npm 包",
    karpathyGist: "Karpathy LLM Wiki 思想",
    license: "MIT 许可证 © 2026。为 AI 智能体生态用心构建。",
    version: "v0.2.0",
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
