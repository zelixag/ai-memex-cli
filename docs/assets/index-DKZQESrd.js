(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const p of document.querySelectorAll('link[rel="modulepreload"]'))f(p);new MutationObserver(p=>{for(const d of p)if(d.type==="childList")for(const s of d.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&f(s)}).observe(document,{childList:!0,subtree:!0});function m(p){const d={};return p.integrity&&(d.integrity=p.integrity),p.referrerPolicy&&(d.referrerPolicy=p.referrerPolicy),p.crossOrigin==="use-credentials"?d.credentials="include":p.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function f(p){if(p.ep)return;p.ep=!0;const d=m(p);fetch(p.href,d)}})();var O=(()=>{try{return!0}catch{return!1}})();function I(o){O&&performance&&performance.mark(`aether:${o}:start`)}function E(o){O&&performance&&(performance.mark(`aether:${o}:end`),performance.measure(o,`aether:${o}:start`,`aether:${o}:end`))}var k=null,R=[];function Y(o){R.push(k),k=o}function J(){k=R.pop()??null}var z=class{constructor(o){this._value=o,this._subscribers=new Set}get value(){return k&&(this._subscribers.add(k),k._dependencies.add(this)),this._value}set value(o){if(!Object.is(this._value,o)){this._value=o;for(const i of this._subscribers)ee(i)}}peek(){return this._value}_unsubscribe(o){this._subscribers.delete(o)}},X=typeof window<"u"?window.__AETHER_HMR__?.componentStates||new Map:new Map,Z=0;function S(o){const i=`s_${Z++}`,m=X.get(i);return m!==void 0?new z(m):new z(o)}var B=class G{constructor(i){this._fn=i,this._dependencies=new Set,this._cleanup=null,this._active=!0,this._id=G._nextId++,this.run()}run(){if(this._active){I(`effect:${this._id}`),this._cleanupDeps(),this._cleanup&&typeof this._cleanup=="function"&&this._cleanup(),Y(this);try{const i=this._fn();typeof i=="function"&&(this._cleanup=i)}finally{J(),E(`effect:${this._id}`)}}}_cleanupDeps(){for(const i of this._dependencies)i._unsubscribe(this);this._dependencies.clear()}dispose(){this._active&&(I(`dispose:${this._id}`),this._active=!1,this._cleanupDeps(),this._cleanup&&typeof this._cleanup=="function"&&(this._cleanup(),this._cleanup=null),E(`dispose:${this._id}`))}};B._nextId=0;var F=B;function P(o){return new F(o)}var L=new Set,H=!1;function ee(o){L.add(o),H||(H=!0,queueMicrotask(te))}function te(){I("flush");const o=L;L=new Set,H=!1;const i=re(o);for(const m of i)m._active&&m.run();E("flush")}function re(o){const i=new Set,m=[];function f(p){if(!i.has(p)){i.add(p);for(const d of p._dependencies)d instanceof F&&f(d);m.push(p)}}for(const p of o)f(p);return m}var W=(()=>{try{return!0}catch{return!1}})();function A(o){W&&performance&&performance.mark(`aether:${o}:start`)}function $(o){W&&performance&&(performance.mark(`aether:${o}:end`),performance.measure(o,`aether:${o}:start`,`aether:${o}:end`))}var _=null,j=class U{constructor(){this._effects=[],this._children=[],this._disposed=!1}addEffect(i){this._effects.push(i)}addChild(i){this._children.push(i)}dispose(){if(!this._disposed){this._disposed=!0,A("component:dispose");for(const i of this._children)typeof i=="object"&&i!==null&&(i instanceof U||typeof i.dispose=="function"?i.dispose():i instanceof Node&&"remove"in i&&i.remove());for(const i of this._effects)i.dispose();this._effects=[],this._children=[],$("component:dispose")}}};function w(o){const i=_,m=new j;_=m,i&&i.addChild(m);let f;try{f=o(m)}finally{_=i}if(typeof f=="function"){const p=f,d=m.dispose.bind(m);m.dispose=()=>{p(),d()}}return f}function r(o){return document.createElement(o)}function y(o){return document.createTextNode(String(o??""))}var D=new Set(["__proto__","constructor","prototype","toString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString"]);function c(o,i,m){if(!D.has(i))if(i==="className"||i==="class")o.className=String(m??"");else if(i.startsWith("on")){const f=i.slice(2).toLowerCase();typeof m=="function"&&o.addEventListener(f,m)}else if(i==="style"&&typeof m=="object"&&m!==null){const f=m,p=Object.keys(f);for(const d of p)D.has(d)||(o.style[d]=f[d])}else typeof m=="boolean"?m?o.setAttribute(i,""):o.removeAttribute(i):o.setAttribute(i,String(m??""))}function M(o,i){if(!(i==null||i===!1||i===!0))if(i instanceof Node)o.appendChild(i);else if(Array.isArray(i))for(const m of i)M(o,m);else o.appendChild(document.createTextNode(String(i)))}function g(o,i){const m=document.createComment("");o.appendChild(m);let f=[];const p=P(()=>{const d=i();for(const s of f)s.remove();f=[],q(d,o,m,f)});return _&&_.addEffect(p),{dispose(){p.dispose();for(const d of f)d.remove();m.remove()}}}function q(o,i,m,f){if(!(o==null||o===!1||o===!0))if(o instanceof Node)i.insertBefore(o,m),f.push(o);else if(Array.isArray(o))for(const p of o)q(p,i,m,f);else{const p=document.createTextNode(String(o));i.insertBefore(p,m),f.push(p)}}function u(o,i,m){A(`bindAttr:${i}`);const f=P(()=>{const p=m();i==="className"||i==="class"?o.className=String(p??""):i==="style"&&typeof p=="object"&&p!==null?Object.assign(o.style,p):typeof p=="boolean"?p?o.setAttribute(i,""):o.removeAttribute(i):o.setAttribute(i,String(p??""))});return _&&_.addEffect(f),$(`bindAttr:${i}`),f}var T=typeof window<"u"?window.__AETHER_HMR__?.instances||(window.__AETHER_HMR__=window.__AETHER_HMR__||{instances:new Map}).instances:new Map;function ne(o,i,m="default"){typeof i=="string"&&(i=document.querySelector(i)),A("mount");const f=T.get(m);let p,d;if(f){f.context.dispose(),p=new j,_=p;try{d=o()}catch(t){return console.error("[Aether HMR] Error re-rendering:",t),ae(t),_=null,$("mount"),f}}else{i&&(i.innerHTML=""),p=new j,_=p;try{d=o()}catch(t){return console.error("[Aether] Mount error:",t),ie(t),_=null,$("mount"),{unmount:()=>{}}}}const s=Array.isArray(d)?d:[d];if(f)oe(f.nodes,s);else if(i)for(const t of s)i.appendChild(t);_=null,$("mount");const n={context:p,nodes:s,componentFn:o,container:i,id:m,unmount(){A("unmount"),p.dispose(),i&&(i.innerHTML=""),T.delete(m),$("unmount")}};return T.set(m,n),n}function oe(o,i){const m=o[0]?.parentNode;if(m){for(const f of o)"remove"in f&&typeof f.remove=="function"&&f.remove();for(const f of i)m.appendChild(f)}}function ie(o){const i=document.createElement("div");i.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #dc3545; color: #fff; padding: 1rem;
    font-family: monospace; font-size: 14px;
  `,i.innerHTML=`
    <div style="font-weight: bold; margin-bottom: 0.5rem;">[Aether Error]</div>
    <div>${o.message||o}</div>
    ${o.stack?`<pre style="font-size: 11px; overflow: auto; max-height: 200px;">${o.stack}</pre>`:""}
  `,document.body.appendChild(i)}function ae(o){const i=document.createElement("div");i.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #fd7e14; color: #fff; padding: 1rem;
    font-family: monospace; font-size: 14px;
  `,i.innerHTML=`
    <div style="font-weight: bold; margin-bottom: 0.5rem;">[Aether HMR Error]</div>
    <div>Hot update failed: ${o.message||o}</div>
    <div style="margin-top: 0.5rem; font-size: 12px;">Preserving previous state...</div>
  `,document.body.appendChild(i),setTimeout(()=>i.remove(),5e3)}var V=new z(typeof window<"u"&&window?.location?.pathname||"/"),se=new z({}),le=[];typeof window<"u"&&window.addEventListener("popstate",()=>{V.value=window.location.pathname,de()});function de(){const o=V.value;for(const i of le){const m=ce(i.path,o);if(m)return se.value=m.params,i}return null}function ce(o,i){const m=[],f=o.replace(/:([^/]+)/g,(n,t)=>(m.push(t),"([^/]+)")).replace(/\*/g,".*"),p=new RegExp(`^${f}$`),d=i.match(p);if(!d)return null;const s={};return m.forEach((n,t)=>{s[n]=d[t+1]||""}),{params:s}}const e={bg:"var(--c-bg)",bgSurface:"var(--c-bg-surface)",bgCard:"var(--c-bg-card)",border:"var(--c-border)",text:"var(--c-text)",textMuted:"var(--c-text-muted)",textDim:"var(--c-text-dim)",accent:"var(--c-accent)",accentHover:"var(--c-accent-hover)",accentDim:"var(--c-accent-dim)",accentWarm:"var(--c-accent-warm)",accentMuted:"var(--c-accent-muted)",codeBg:"var(--c-code-bg)",codeText:"var(--c-code-text)",navBg:"var(--c-nav-bg)",activeBg:"var(--c-active-bg)",shadow:"var(--c-shadow)",shadowAccent:"var(--c-shadow-accent)",green:"var(--c-green)"},b={display:"var(--font-display)",sans:"var(--font-sans)",mono:"var(--font-mono)"};function K(){return typeof window>"u"?"light":localStorage.getItem("aether-theme")||"light"}function Q(o){document.documentElement.setAttribute("data-theme",o),localStorage.setItem("aether-theme",o)}function pe(){const o=document.documentElement.getAttribute("data-theme")||"light";return Q(o==="dark"?"light":"dark"),o==="dark"?"light":"dark"}function me(){Q(K())}const N={en:{nav:{features:"Features",architecture:"Architecture",commands:"Commands",comparison:"Comparison",quickstart:"Quick Start",github:"GitHub",getStarted:"Get Started"},hero:{badge:"Inspired by Karpathy's LLM Wiki",title1:"Persistent Memory",title2:"for AI Agents",desc:"The universal CLI that builds structured knowledge wikis from raw documents and conversations. Works with Claude Code, Codex, Cursor, and 5+ more agents.",install:"npm install -g ai-memex-cli",copy:"Copy",copied:"Copied!",cta1:"Quick Start Guide",cta2:"View on GitHub"},features:{sectionBadge:"✦  Core Capabilities",sectionTitle:"Everything Your AI Needs",sectionDesc:"Build, maintain, and leverage persistent knowledge for your AI agents.",items:[{subtitle:"Built-in Web Scraper",title:"Fetch & Crawl",desc:"Grab documentation from any URL, crawl entire doc sites via sitemap, or search by keywords — all saved as clean Markdown in your raw/ directory. No API key needed.",code:`memex fetch "react hooks best practices"
memex fetch https://docs.anthropic.com --depth 2
memex fetch https://nextjs.org/sitemap.xml --sitemap`},{subtitle:"Role-Based Best Practices",title:"Distill Sessions",desc:"Extract structured best practices from your AI agent conversations. Automatically discovers session files, distills them by role (backend, frontend, devops), and builds your team's knowledge base.",code:`memex distill --latest --role backend
memex distill ./chat-log.jsonl --role "tech-lead"
memex distill --latest --agent claude-code`},{subtitle:"One CLI, Every Agent",title:"Universal Agent Support",desc:"Works with Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Aider, Continue.dev, and more. One onboard command sets up slash commands for your chosen agent.",code:`memex onboard
# → Choose agent → Auto-detect sessions
# → Init vault → Install /memex:* commands`}],smallFeatures:[{title:"Smart Search",desc:"Full-text search across wiki and raw files with keyword highlighting and relevance scoring."},{title:"Structured Wiki",desc:"Entities, concepts, sources, summaries — each with frontmatter schema validation and cross-linking."},{title:"Health Checks",desc:"Lint for broken links, orphan pages, missing frontmatter. Keep your knowledge base clean and connected."}]},arch:{badge:"✦  System Design",title:"Three-Layer Architecture",desc:"A clean separation between your AI agents, the CLI orchestration layer, and the persistent vault storage.",layers:[{label:"Layer 3 — AI Agent",desc:"Claude Code · Codex · OpenCode · Cursor · Gemini CLI · Aider · Continue.dev"},{label:"Layer 2 — CLI (ai-memex-cli)",desc:"fetch · distill · onboard · search · wiki · config · update"},{label:"Layer 1 — Vault Storage",desc:"wiki/ · raw/ · log.md · .memex/config.json"}],vaultTitle:"Vault Structure",vaultItems:[{name:"wiki/",desc:"Structured Markdown knowledge pages with YAML frontmatter"},{name:"raw/",desc:"Raw fetched documents, session logs, source materials"},{name:"log.md",desc:"Chronological activity log with timestamps and metadata"},{name:".memex/config.json",desc:"Per-vault configuration: agent, roles, paths"}]},commands:{badge:"✦  CLI Reference",title:"All Commands",desc:"Every command you need to build and maintain your AI knowledge base.",tabs:["Core Commands","Utility Commands"],core:[{cmd:"fetch",desc:"Fetch a URL, crawl a sitemap, or search by keyword",usage:"memex fetch <url|query> [--sitemap] [--depth N] [--agent]"},{cmd:"distill",desc:"Distill AI session logs into structured best practices",usage:"memex distill [file] [--latest] [--role <role>] [--agent <agent>]"},{cmd:"onboard",desc:"Interactive 5-step setup wizard for new projects",usage:"memex onboard"},{cmd:"search",desc:"Full-text search across wiki and raw files",usage:"memex search <query> [--wiki] [--raw] [--limit N]"},{cmd:"wiki",desc:"Create, edit, list, and validate wiki pages",usage:"memex wiki <create|edit|list|validate> [name]"},{cmd:"log",desc:"View or append to the activity log",usage:'memex log [--tail N] [--append "message"]'}],utility:[{cmd:"config",desc:"Get or set vault configuration values",usage:"memex config [get|set|list] [key] [value]"},{cmd:"update",desc:"Self-update to the latest version",usage:"memex update [--check]"},{cmd:"init",desc:"Initialize a new vault in the current directory",usage:"memex init [--agent <agent>]"},{cmd:"status",desc:"Show vault health, stats, and recent activity",usage:"memex status"},{cmd:"export",desc:"Export wiki as HTML, PDF, or JSON",usage:"memex export [--format html|pdf|json] [--out <dir>]"},{cmd:"lint",desc:"Check for broken links, orphan pages, schema errors",usage:"memex lint [--fix]"}]},comparison:{badge:"✦  Why ai-memex-cli",title:"How We Compare",desc:"See how ai-memex-cli stacks up against other knowledge management approaches.",features:["Persistent Wiki","Web Fetch/Crawl","Session Distill","Multi-Agent","Interactive Onboarding","Self-Update","Zero Config"],tools:["ai-memex-cli","mem0","Obsidian","Notion","Plain Files"]},quickstart:{badge:"✦  Get Started",title:"Up and Running in 60 Seconds",steps:[{num:"01",title:"Install",code:"npm install -g ai-memex-cli"},{num:"02",title:"Initialize your vault",code:`cd my-project
memex init`},{num:"03",title:"Run the onboarding wizard",code:`memex onboard
# Guides you through agent setup,
# session detection, and slash commands`},{num:"04",title:"Fetch your first document",code:`memex fetch "typescript best practices"
# Saved to raw/ as clean Markdown`},{num:"05",title:"Distill your AI sessions",code:`memex distill --latest --role backend
# Extracts best practices → wiki/`}],cta:"View Full Documentation"},footer:{tagline:"Built for developers who want their AI agents to remember.",links:["GitHub","npm","Issues"],copyright:"© 2024 ai-memex-cli. MIT License."}},zh:{nav:{features:"功能特性",architecture:"架构设计",commands:"命令参考",comparison:"对比分析",quickstart:"快速开始",github:"GitHub",getStarted:"立即开始"},hero:{badge:"灵感来自 Karpathy 的 LLM Wiki",title1:"持久记忆",title2:"为 AI 智能体",desc:"通用 CLI 工具，将原始文档和对话构建成结构化知识 Wiki。支持 Claude Code、Codex、Cursor 及 5+ 款智能体。",install:"npm install -g ai-memex-cli",copy:"复制",copied:"已复制！",cta1:"快速开始指南",cta2:"查看 GitHub"},features:{sectionBadge:"✦  核心功能",sectionTitle:"AI 所需的一切",sectionDesc:"构建、维护并充分利用 AI 智能体的持久知识库。",items:[{subtitle:"内置网页抓取器",title:"抓取与爬取",desc:"从任意 URL 获取文档，通过 sitemap 爬取整个文档站，或按关键词搜索——全部以干净的 Markdown 格式保存到 raw/ 目录，无需 API 密钥。",code:`memex fetch "react hooks 最佳实践"
memex fetch https://docs.anthropic.com --depth 2
memex fetch https://nextjs.org/sitemap.xml --sitemap`},{subtitle:"基于角色的最佳实践",title:"蒸馏会话",desc:"从 AI 智能体对话中提取结构化最佳实践。自动发现会话文件，按角色（后端、前端、运维）进行蒸馏，构建团队知识库。",code:`memex distill --latest --role backend
memex distill ./chat-log.jsonl --role "tech-lead"
memex distill --latest --agent claude-code`},{subtitle:"一个 CLI，所有智能体",title:"通用智能体支持",desc:"支持 Claude Code、Codex、OpenCode、Cursor、Gemini CLI、Aider、Continue.dev 等。一条 onboard 命令即可为所选智能体安装斜杠命令。",code:`memex onboard
# → 选择智能体 → 自动检测会话
# → 初始化 vault → 安装 /memex:* 命令`}],smallFeatures:[{title:"智能搜索",desc:"跨 wiki 和 raw 文件的全文搜索，支持关键词高亮和相关性排序。"},{title:"结构化 Wiki",desc:"实体、概念、来源、摘要——每项均有 frontmatter 模式验证和交叉链接。"},{title:"健康检查",desc:"检查断链、孤立页面、缺失 frontmatter，保持知识库整洁有序。"}]},arch:{badge:"✦  系统设计",title:"三层架构",desc:"AI 智能体、CLI 编排层与持久化存储层之间清晰分离。",layers:[{label:"第三层 — AI 智能体",desc:"Claude Code · Codex · OpenCode · Cursor · Gemini CLI · Aider · Continue.dev"},{label:"第二层 — CLI (ai-memex-cli)",desc:"fetch · distill · onboard · search · wiki · config · update"},{label:"第一层 — Vault 存储",desc:"wiki/ · raw/ · log.md · .memex/config.json"}],vaultTitle:"Vault 目录结构",vaultItems:[{name:"wiki/",desc:"带 YAML frontmatter 的结构化 Markdown 知识页面"},{name:"raw/",desc:"原始抓取文档、会话日志、原始资料"},{name:"log.md",desc:"带时间戳和元数据的时序活动日志"},{name:".memex/config.json",desc:"每个 vault 的配置：智能体、角色、路径"}]},commands:{badge:"✦  命令参考",title:"所有命令",desc:"构建和维护 AI 知识库所需的每条命令。",tabs:["核心命令","工具命令"],core:[{cmd:"fetch",desc:"抓取 URL、爬取 sitemap 或按关键词搜索",usage:"memex fetch <url|关键词> [--sitemap] [--depth N] [--agent]"},{cmd:"distill",desc:"将 AI 会话日志蒸馏为结构化最佳实践",usage:"memex distill [文件] [--latest] [--role <角色>] [--agent <智能体>]"},{cmd:"onboard",desc:"新项目的交互式 5 步引导向导",usage:"memex onboard"},{cmd:"search",desc:"跨 wiki 和 raw 文件的全文搜索",usage:"memex search <关键词> [--wiki] [--raw] [--limit N]"},{cmd:"wiki",desc:"创建、编辑、列出和验证 wiki 页面",usage:"memex wiki <create|edit|list|validate> [名称]"},{cmd:"log",desc:"查看或追加活动日志",usage:'memex log [--tail N] [--append "消息"]'}],utility:[{cmd:"config",desc:"获取或设置 vault 配置值",usage:"memex config [get|set|list] [键] [值]"},{cmd:"update",desc:"自更新到最新版本",usage:"memex update [--check]"},{cmd:"init",desc:"在当前目录初始化新 vault",usage:"memex init [--agent <智能体>]"},{cmd:"status",desc:"显示 vault 健康状态、统计和近期活动",usage:"memex status"},{cmd:"export",desc:"将 wiki 导出为 HTML、PDF 或 JSON",usage:"memex export [--format html|pdf|json] [--out <目录>]"},{cmd:"lint",desc:"检查断链、孤立页面、模式错误",usage:"memex lint [--fix]"}]},comparison:{badge:"✦  为何选择 ai-memex-cli",title:"横向对比",desc:"了解 ai-memex-cli 与其他知识管理方案的差异。",features:["持久化 Wiki","网页抓取/爬取","会话蒸馏","多智能体支持","交互式引导","自动更新","零配置"],tools:["ai-memex-cli","mem0","Obsidian","Notion","纯文件"]},quickstart:{badge:"✦  快速开始",title:"60 秒上手",steps:[{num:"01",title:"安装",code:"npm install -g ai-memex-cli"},{num:"02",title:"初始化 vault",code:`cd my-project
memex init`},{num:"03",title:"运行引导向导",code:`memex onboard
# 引导完成智能体配置、
# 会话检测和斜杠命令安装`},{num:"04",title:"抓取第一个文档",code:`memex fetch "typescript 最佳实践"
# 以干净 Markdown 保存到 raw/`},{num:"05",title:"蒸馏 AI 会话",code:`memex distill --latest --role backend
# 提取最佳实践 → wiki/`}],cta:"查看完整文档"},footer:{tagline:"为希望 AI 智能体拥有记忆的开发者而生。",links:["GitHub","npm","问题反馈"],copyright:"© 2024 ai-memex-cli. MIT 许可证。"}}};function ue(){return typeof window>"u"?"en":localStorage.getItem("memex-lang")||"en"}function fe(o){localStorage.setItem("memex-lang",o)}function C(o){return N[o]||N.en}function ge({lang:o,theme:i,onToggleLang:m,onToggleTheme:f}){const p=C(o),d=n=>{const t=document.getElementById(n);t&&t.scrollIntoView({behavior:"smooth"})},s=[{label:p.nav.features,id:"features"},{label:p.nav.architecture,id:"architecture"},{label:p.nav.commands,id:"commands"},{label:p.nav.comparison,id:"comparison"}];return(()=>{const n=r("nav");return u(n,"style",()=>`
      position: sticky; top: 0; z-index: 100;
      background: ${e.navBg};
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid ${e.border};
      padding: 0 2rem;
      height: 60px;
      display: flex; align-items: center; justify-content: space-between;
    `),n.appendChild((()=>{const t=r("div");return c(t,"style","display: flex; align-items: center; gap: 0.75rem; cursor: pointer"),c(t,"onClick",()=>window.scrollTo({top:0,behavior:"smooth"})),t.appendChild((()=>{const a=r("div");return u(a,"style",()=>`
          width: 32px; height: 32px; border-radius: 8px;
          background: ${e.accent};
          display: flex; align-items: center; justify-content: center;
          font-family: ${b.mono}; font-size: 0.75rem; font-weight: 500;
          color: white; letter-spacing: -0.05em;
        `),a.appendChild(y("mx")),a})()),t.appendChild((()=>{const a=r("span");return u(a,"style",()=>`
          font-family: ${b.mono}; font-size: 0.9rem; font-weight: 500;
          color: ${e.text}; letter-spacing: -0.02em;
        `),a.appendChild(y("ai-memex-cli")),a})()),t})()),n.appendChild((()=>{const t=r("div");return c(t,"style","display: flex; align-items: center; gap: 0.25rem"),g(t,()=>s.map(a=>(()=>{const l=r("button");return c(l,"onClick",()=>d(a.id)),u(l,"style",()=>`
              padding: 0.375rem 0.875rem; border-radius: 6px;
              border: none; background: transparent;
              color: ${e.textMuted}; font-size: 0.875rem; font-weight: 500;
              cursor: pointer; transition: all 0.2s;
              font-family: ${b.sans};
            `),c(l,"onMouseenter",h=>{h.target.style.background=e.activeBg,h.target.style.color=e.text}),c(l,"onMouseleave",h=>{h.target.style.background="transparent",h.target.style.color=e.textMuted}),g(l,()=>a.label),l})())),t})()),n.appendChild((()=>{const t=r("div");return c(t,"style","display: flex; align-items: center; gap: 0.5rem"),t.appendChild((()=>{const a=r("button");return c(a,"onClick",m),u(a,"style",()=>`
            padding: 0.375rem 0.75rem; border-radius: 6px;
            border: 1px solid ${e.border}; background: ${e.bgSurface};
            color: ${e.textMuted}; font-size: 0.8rem; font-weight: 600;
            cursor: pointer; transition: all 0.2s;
            font-family: ${b.mono};
          `),c(a,"onMouseenter",l=>{l.target.style.borderColor=e.accent,l.target.style.color=e.accent}),c(a,"onMouseleave",l=>{l.target.style.borderColor=e.border,l.target.style.color=e.textMuted}),g(a,()=>o==="en"?"中文":"EN"),a})()),t.appendChild((()=>{const a=r("button");return c(a,"onClick",f),u(a,"style",()=>`
            width: 36px; height: 36px; border-radius: 8px;
            border: 1px solid ${e.border}; background: ${e.bgSurface};
            color: ${e.textMuted}; font-size: 1rem;
            cursor: pointer; transition: all 0.2s;
            display: flex; align-items: center; justify-content: center;
          `),c(a,"onMouseenter",l=>{l.target.style.borderColor=e.accent,l.target.style.color=e.accent}),c(a,"onMouseleave",l=>{l.target.style.borderColor=e.border,l.target.style.color=e.textMuted}),g(a,()=>i==="dark"?"☀":"◑"),a})()),t.appendChild((()=>{const a=r("a");return c(a,"href","https://github.com/zelixag/ai-memex-cli"),c(a,"target","_blank"),u(a,"style",()=>`
            padding: 0.375rem 1rem; border-radius: 6px;
            border: 2px solid ${e.accent}; background: ${e.accent};
            color: white; font-size: 0.875rem; font-weight: 600;
            cursor: pointer; transition: all 0.2s;
            display: inline-flex; align-items: center; gap: 0.375rem;
            text-decoration: none;
          `),c(a,"onMouseenter",l=>{l.currentTarget.style.background=e.accentHover,l.currentTarget.style.borderColor=e.accentHover}),c(a,"onMouseleave",l=>{l.currentTarget.style.background=e.accent,l.currentTarget.style.borderColor=e.accent}),a.appendChild((()=>{const l=r("svg");return c(l,"width","14"),c(l,"height","14"),c(l,"viewBox","0 0 24 24"),c(l,"fill","currentColor"),l.appendChild((()=>{const h=r("path");return c(h,"d","M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"),h})()),l})()),a.appendChild(y(" GitHub ")),a})()),t})()),n})()}const he="https://manus.im/api/cdn/file/webdev/4b5a7c7c/hero-map.png";function be({lang:o}){const i=C(o),m=S(!1),f=()=>{navigator.clipboard.writeText("npm install -g ai-memex-cli").then(()=>{m=!0,setTimeout(()=>{m=!1},2e3)})},p=d=>{const s=document.getElementById(d);s&&s.scrollIntoView({behavior:"smooth"})};return(()=>{const d=r("section");return c(d,"style",`
      min-height: calc(100vh - 60px);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      max-width: 1400px;
      margin: 0 auto;
      padding: 4rem 2rem 2rem;
      align-items: center;
    `),d.appendChild((()=>{const s=r("div");return c(s,"style","padding-right: 3rem; max-width: 560px"),s.appendChild((()=>{const n=r("div");return u(n,"style",()=>`
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.8rem; font-weight: 600; color: ${e.accent};
          text-transform: uppercase; letter-spacing: 0.12em;
          margin-bottom: 2rem;
          padding: 0.375rem 0.875rem;
          border: 1px solid ${e.accent};
          border-radius: 100px;
          background: ${e.accentDim};
        `),n.appendChild((()=>{const t=r("span");return t.appendChild(y("✦")),t})()),n.appendChild((()=>{const t=r("span");return g(t,()=>i.hero.badge),t})()),n})()),s.appendChild((()=>{const n=r("h1");return u(n,"style",()=>`
          font-family: ${b.display};
          font-size: clamp(2.8rem, 5vw, 4rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin-bottom: 1.5rem;
          color: ${e.text};
        `),g(n,()=>i.hero.title1),n.appendChild(r("br")),n.appendChild((()=>{const t=r("span");return u(t,"style",()=>`color: ${e.accent}; font-style: italic`),g(t,()=>i.hero.title2),t})()),n})()),s.appendChild((()=>{const n=r("p");return u(n,"style",()=>`
          font-size: 1.1rem; color: ${e.textMuted};
          line-height: 1.7; margin-bottom: 2.5rem;
        `),g(n,()=>i.hero.desc),n})()),s.appendChild((()=>{const n=r("div");return u(n,"style",()=>`
          display: flex; align-items: center; gap: 0;
          background: ${e.codeBg};
          border: 1px solid ${e.border};
          border-radius: 10px;
          margin-bottom: 2rem;
          overflow: hidden;
        `),n.appendChild((()=>{const t=r("span");return u(t,"style",()=>`
            color: ${e.accentWarm}; font-family: ${b.mono};
            font-size: 0.875rem; padding: 0.75rem 0.75rem 0.75rem 1rem;
            user-select: none;
          `),t.appendChild(y("$")),t})()),n.appendChild((()=>{const t=r("code");return u(t,"style",()=>`
            font-family: ${b.mono}; font-size: 0.875rem;
            color: ${e.codeText}; flex: 1; padding: 0.75rem 0;
            user-select: all;
          `),g(t,()=>i.hero.install),t})()),n.appendChild((()=>{const t=r("button");return c(t,"onClick",f),u(t,"style",()=>`
              padding: 0.75rem 1rem;
              border: none; border-left: 1px solid ${e.border};
              background: transparent;
              color: ${e.textDim}; font-size: 0.8rem; font-weight: 500;
              cursor: pointer; transition: all 0.2s;
              font-family: ${b.sans};
              white-space: nowrap;
            `),c(t,"onMouseenter",a=>{a.target.style.color=e.accent,a.target.style.background=e.accentDim}),c(t,"onMouseleave",a=>{a.target.style.color=e.textDim,a.target.style.background="transparent"}),g(t,()=>m.value?i.hero.copied:i.hero.copy),t})()),n})()),s.appendChild((()=>{const n=r("div");return c(n,"style","display: flex; gap: 0.875rem; flex-wrap: wrap"),n.appendChild((()=>{const t=r("button");return c(t,"onClick",()=>p("quickstart")),u(t,"style",()=>`
              padding: 0.875rem 1.5rem; border-radius: 10px;
              border: 2px solid ${e.accent};
              background: ${e.accent}; color: white;
              font-size: 0.9375rem; font-weight: 600; cursor: pointer;
              font-family: ${b.sans};
              box-shadow: 4px 4px 0 ${e.accentMuted};
              transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            `),c(t,"onMouseenter",a=>{a.target.style.transform="translate(-2px, -2px)",a.target.style.boxShadow=`6px 6px 0 ${e.accentMuted}`}),c(t,"onMouseleave",a=>{a.target.style.transform="none",a.target.style.boxShadow=`4px 4px 0 ${e.accentMuted}`}),g(t,()=>i.hero.cta1),t})()),n.appendChild((()=>{const t=r("a");return c(t,"href","https://github.com/zelixag/ai-memex-cli"),c(t,"target","_blank"),u(t,"style",()=>`
              padding: 0.875rem 1.5rem; border-radius: 10px;
              border: 2px solid ${e.border}; background: ${e.bgSurface};
              color: ${e.text}; font-size: 0.9375rem; font-weight: 600;
              cursor: pointer; text-decoration: none;
              display: inline-flex; align-items: center; gap: 0.5rem;
              transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
              box-shadow: 4px 4px 0 ${e.border};
            `),c(t,"onMouseenter",a=>{a.currentTarget.style.transform="translate(-2px, -2px)",a.currentTarget.style.boxShadow=`6px 6px 0 ${e.border}`}),c(t,"onMouseleave",a=>{a.currentTarget.style.transform="none",a.currentTarget.style.boxShadow=`4px 4px 0 ${e.border}`}),t.appendChild((()=>{const a=r("svg");return c(a,"width","16"),c(a,"height","16"),c(a,"viewBox","0 0 24 24"),c(a,"fill","currentColor"),a.appendChild((()=>{const l=r("path");return c(l,"d","M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"),l})()),a})()),g(t,()=>i.hero.cta2),t})()),n})()),s})()),d.appendChild((()=>{const s=r("div");return c(s,"style","position: relative; display: flex; justify-content: center; align-items: center"),s.appendChild((()=>{const n=r("div");return u(n,"style",()=>`
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid ${e.border};
          box-shadow: 12px 12px 0 ${e.border}, 24px 24px 0 ${e.shadowAccent};
        `),n.appendChild((()=>{const t=r("img");return c(t,"src",he),c(t,"alt","Memex knowledge map illustration"),c(t,"style","width: 100%; max-width: 560px; display: block; object-fit: cover"),t})()),n})()),s})()),d})()}const xe=["https://manus.im/api/cdn/file/webdev/4b5a7c7c/feature-fetch.png","https://manus.im/api/cdn/file/webdev/4b5a7c7c/feature-distill.png","https://manus.im/api/cdn/file/webdev/4b5a7c7c/feature-agents.png"];function _e({lang:o}){const i=C(o),m=i.features.items;return(()=>{const f=r("section");return c(f,"id","features"),u(f,"style",()=>`
      padding: 6rem 2rem;
      background: ${e.bgSurface};
      border-top: 1px solid ${e.border};
    `),f.appendChild((()=>{const p=r("div");return c(p,"style","max-width: 1200px; margin: 0 auto"),p.appendChild((()=>{const d=r("div");return c(d,"style","text-align: center; margin-bottom: 4rem"),d.appendChild((()=>{const s=r("div");return u(s,"style",()=>`
            display: inline-flex; align-items: center; gap: 0.5rem;
            font-size: 0.8rem; font-weight: 600; color: ${e.accent};
            text-transform: uppercase; letter-spacing: 0.12em;
            margin-bottom: 1rem;
          `),g(s,()=>i.features.sectionBadge),s})()),d.appendChild((()=>{const s=r("h2");return u(s,"style",()=>`
            font-family: ${b.display};
            font-size: clamp(2rem, 4vw, 2.75rem);
            font-weight: 700; letter-spacing: -0.03em;
            color: ${e.text}; margin-bottom: 1rem;
          `),g(s,()=>i.features.sectionTitle),s})()),d.appendChild((()=>{const s=r("p");return u(s,"style",()=>`
            font-size: 1.1rem; color: ${e.textMuted};
            max-width: 480px; margin: 0 auto; line-height: 1.65;
          `),g(s,()=>i.features.sectionDesc),s})()),d})()),p.appendChild((()=>{const d=r("div");return c(d,"style","display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 1.5rem"),g(d,()=>m.map((s,n)=>(()=>{const t=r("div");return u(t,"style",()=>`
              background: ${e.bg};
              border: 1px solid ${e.border};
              border-radius: 20px;
              overflow: hidden;
              transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
              box-shadow: 4px 4px 0 ${e.border};
            `),c(t,"onMouseenter",a=>{a.currentTarget.style.transform="translate(-3px, -3px)",a.currentTarget.style.boxShadow=`7px 7px 0 ${e.border}`}),c(t,"onMouseleave",a=>{a.currentTarget.style.transform="none",a.currentTarget.style.boxShadow=`4px 4px 0 ${e.border}`}),t.appendChild((()=>{const a=r("div");return c(a,"style","height: 200px; overflow: hidden; border-bottom: 1px solid ${colors.border}"),a.appendChild((()=>{const l=r("img");return u(l,"src",()=>xe[n]),u(l,"alt",()=>s.title),c(l,"style","width: 100%; height: 100%; object-fit: cover; display: block"),l})()),a})()),t.appendChild((()=>{const a=r("div");return c(a,"style","padding: 1.75rem"),a.appendChild((()=>{const l=r("div");return u(l,"style",()=>`
                  font-size: 0.75rem; font-weight: 600; color: ${e.accent};
                  text-transform: uppercase; letter-spacing: 0.1em;
                  margin-bottom: 0.5rem;
                `),g(l,()=>s.subtitle),l})()),a.appendChild((()=>{const l=r("h3");return u(l,"style",()=>`
                  font-family: ${b.display};
                  font-size: 1.375rem; font-weight: 700;
                  color: ${e.text}; margin-bottom: 0.75rem;
                  letter-spacing: -0.02em;
                `),g(l,()=>s.title),l})()),a.appendChild((()=>{const l=r("p");return u(l,"style",()=>`
                  font-size: 0.9rem; color: ${e.textMuted};
                  line-height: 1.65; margin-bottom: 1.25rem;
                `),g(l,()=>s.desc),l})()),a.appendChild((()=>{const l=r("div");return u(l,"style",()=>`
                  background: ${e.codeBg};
                  border-radius: 10px;
                  padding: 1rem;
                  border: 1px solid ${e.border};
                `),l.appendChild((()=>{const h=r("pre");return u(h,"style",()=>`
                    font-family: ${b.mono}; font-size: 0.78rem;
                    color: ${e.codeText}; line-height: 1.6;
                    white-space: pre-wrap; word-break: break-all;
                    margin: 0;
                  `),g(h,()=>s.code),h})()),l})()),a})()),t})())),d})()),p.appendChild((()=>{const d=r("div");return c(d,"style","display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem"),g(d,()=>i.features.smallFeatures.map((s,n)=>{const t=["⌕","◈","✓"];return(()=>{const a=r("div");return u(a,"style",()=>`
                background: ${e.bg};
                border: 1px solid ${e.border};
                border-radius: 16px;
                padding: 1.5rem;
                display: flex; gap: 1rem; align-items: flex-start;
              `),a.appendChild((()=>{const l=r("div");return u(l,"style",()=>`
                  width: 40px; height: 40px; flex-shrink: 0;
                  background: ${e.accentDim};
                  border: 1px solid ${e.border};
                  border-radius: 10px;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 1.1rem; color: ${e.accent};
                `),g(l,()=>t[n]),l})()),a.appendChild((()=>{const l=r("div");return l.appendChild((()=>{const h=r("h4");return u(h,"style",()=>`
                    font-weight: 600; font-size: 0.9375rem;
                    color: ${e.text}; margin-bottom: 0.375rem;
                  `),g(h,()=>s.title),h})()),l.appendChild((()=>{const h=r("p");return u(h,"style",()=>`font-size: 0.875rem; color: ${e.textMuted}; line-height: 1.55`),g(h,()=>s.desc),h})()),l})()),a})()})),d})()),p})()),f})()}const ye="https://manus.im/api/cdn/file/webdev/4b5a7c7c/architecture-diagram.png";function ve({lang:o}){const m=C(o).arch,f=[{bg:"rgba(196, 93, 53, 0.08)",border:"rgba(196, 93, 53, 0.3)",dot:e.accent},{bg:"rgba(74, 144, 226, 0.08)",border:"rgba(74, 144, 226, 0.3)",dot:"#4a90e2"},{bg:"rgba(80, 160, 100, 0.08)",border:"rgba(80, 160, 100, 0.3)",dot:"#50a064"}];return(()=>{const p=r("section");return c(p,"id","architecture"),u(p,"style",()=>`
      padding: 6rem 2rem;
      background: ${e.bg};
      border-top: 1px solid ${e.border};
    `),p.appendChild((()=>{const d=r("div");return c(d,"style","max-width: 1200px; margin: 0 auto"),d.appendChild((()=>{const s=r("div");return c(s,"style","margin-bottom: 3.5rem"),s.appendChild((()=>{const n=r("div");return u(n,"style",()=>`
            font-size: 0.8rem; font-weight: 600; color: ${e.accent};
            text-transform: uppercase; letter-spacing: 0.12em;
            margin-bottom: 1rem;
          `),g(n,()=>m.badge),n})()),s.appendChild((()=>{const n=r("h2");return u(n,"style",()=>`
            font-family: ${b.display};
            font-size: clamp(2rem, 4vw, 2.75rem);
            font-weight: 700; letter-spacing: -0.03em;
            color: ${e.text}; margin-bottom: 1rem;
          `),g(n,()=>m.title),n})()),s.appendChild((()=>{const n=r("p");return u(n,"style",()=>`
            font-size: 1.1rem; color: ${e.textMuted};
            max-width: 520px; line-height: 1.65;
          `),g(n,()=>m.desc),n})()),s})()),d.appendChild((()=>{const s=r("div");return c(s,"style","display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start"),s.appendChild((()=>{const n=r("div");return u(n,"style",()=>`
            border-radius: 20px;
            overflow: hidden;
            border: 2px solid ${e.border};
            box-shadow: 8px 8px 0 ${e.border};
          `),n.appendChild((()=>{const t=r("img");return c(t,"src",ye),c(t,"alt","Memex System Architecture"),c(t,"style","width: 100%; display: block; object-fit: cover"),t})()),n})()),s.appendChild((()=>{const n=r("div");return n.appendChild((()=>{const t=r("div");return c(t,"style","display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem"),g(t,()=>m.layers.map((a,l)=>(()=>{const h=r("div");return u(h,"style",()=>`
                  padding: 1.25rem 1.5rem;
                  background: ${f[l].bg};
                  border: 1px solid ${f[l].border};
                  border-radius: 14px;
                  display: flex; align-items: flex-start; gap: 1rem;
                `),h.appendChild((()=>{const x=r("div");return u(x,"style",()=>`
                    width: 10px; height: 10px; border-radius: 50%;
                    background: ${f[l].dot};
                    margin-top: 5px; flex-shrink: 0;
                  `),x})()),h.appendChild((()=>{const x=r("div");return x.appendChild((()=>{const v=r("div");return u(v,"style",()=>`
                      font-size: 0.8rem; font-weight: 700;
                      color: ${f[l].dot};
                      text-transform: uppercase; letter-spacing: 0.08em;
                      margin-bottom: 0.25rem;
                    `),g(v,()=>a.label),v})()),x.appendChild((()=>{const v=r("div");return u(v,"style",()=>`
                      font-family: ${b.mono}; font-size: 0.82rem;
                      color: ${e.textMuted}; line-height: 1.5;
                    `),g(v,()=>a.desc),v})()),x})()),h})())),t})()),n.appendChild((()=>{const t=r("div");return u(t,"style",()=>`
              background: ${e.bgSurface};
              border: 1px solid ${e.border};
              border-radius: 16px;
              overflow: hidden;
            `),t.appendChild((()=>{const a=r("div");return u(a,"style",()=>`
                padding: 0.875rem 1.25rem;
                background: ${e.bgCard};
                border-bottom: 1px solid ${e.border};
                font-size: 0.8rem; font-weight: 700;
                color: ${e.textMuted};
                text-transform: uppercase; letter-spacing: 0.08em;
                font-family: ${b.mono};
              `),g(a,()=>m.vaultTitle),a})()),g(t,()=>m.vaultItems.map((a,l)=>(()=>{const h=r("div");return u(h,"style",()=>`
                  padding: 0.875rem 1.25rem;
                  display: flex; gap: 1rem; align-items: flex-start;
                  border-bottom: ${l<m.vaultItems.length-1?`1px solid ${e.border}`:"none"};
                `),h.appendChild((()=>{const x=r("code");return u(x,"style",()=>`
                    font-family: ${b.mono}; font-size: 0.82rem;
                    color: ${e.accent}; font-weight: 500;
                    white-space: nowrap; flex-shrink: 0;
                    min-width: 140px;
                  `),g(x,()=>a.name),x})()),h.appendChild((()=>{const x=r("span");return u(x,"style",()=>`font-size: 0.875rem; color: ${e.textMuted}; line-height: 1.5`),g(x,()=>a.desc),x})()),h})())),t})()),n})()),s})()),d})()),p})()}function we({lang:o}){const m=C(o).commands,f=S(0);return(()=>{const p=r("section");return c(p,"id","commands"),u(p,"style",()=>`
      padding: 6rem 2rem;
      background: ${e.bgSurface};
      border-top: 1px solid ${e.border};
    `),p.appendChild((()=>{const d=r("div");return c(d,"style","max-width: 1100px; margin: 0 auto"),d.appendChild((()=>{const s=r("div");return c(s,"style","margin-bottom: 3rem"),s.appendChild((()=>{const n=r("div");return u(n,"style",()=>`
            font-size: 0.8rem; font-weight: 600; color: ${e.accent};
            text-transform: uppercase; letter-spacing: 0.12em;
            margin-bottom: 1rem;
          `),g(n,()=>m.badge),n})()),s.appendChild((()=>{const n=r("h2");return u(n,"style",()=>`
            font-family: ${b.display};
            font-size: clamp(2rem, 4vw, 2.75rem);
            font-weight: 700; letter-spacing: -0.03em;
            color: ${e.text}; margin-bottom: 1rem;
          `),g(n,()=>m.title),n})()),s.appendChild((()=>{const n=r("p");return u(n,"style",()=>`font-size: 1.1rem; color: ${e.textMuted}; line-height: 1.65`),g(n,()=>m.desc),n})()),s})()),d.appendChild((()=>{const s=r("div");return u(s,"style",()=>`
          display: flex; gap: 0.25rem;
          background: ${e.bgCard};
          border: 1px solid ${e.border};
          border-radius: 10px;
          padding: 0.25rem;
          width: fit-content;
          margin-bottom: 2rem;
        `),g(s,()=>m.tabs.map((n,t)=>(()=>{const a=r("button");return c(a,"onClick",()=>{f.value=t}),u(a,"style",()=>`
                padding: 0.5rem 1.25rem; border-radius: 7px;
                border: none;
                background: ${f.value===t?e.bg:"transparent"};
                color: ${f.value===t?e.text:e.textMuted};
                font-size: 0.875rem; font-weight: ${f.value===t?"600":"500"};
                cursor: pointer; transition: all 0.2s;
                font-family: ${b.sans};
                box-shadow: ${f.value===t?`0 1px 3px ${e.shadow}`:"none"};
              `),M(a,n),a})())),s})()),d.appendChild((()=>{const s=r("div");return u(s,"style",()=>`
          background: ${e.bg};
          border: 1px solid ${e.border};
          border-radius: 16px;
          overflow: hidden;
        `),s.appendChild((()=>{const n=r("div");return u(n,"style",()=>`
            display: grid; grid-template-columns: 140px 1fr 1fr;
            padding: 0.75rem 1.5rem;
            background: ${e.bgCard};
            border-bottom: 1px solid ${e.border};
            font-size: 0.75rem; font-weight: 700;
            color: ${e.textDim};
            text-transform: uppercase; letter-spacing: 0.08em;
            font-family: ${b.mono};
          `),n.appendChild((()=>{const t=r("span");return t.appendChild(y("Command")),t})()),n.appendChild((()=>{const t=r("span");return t.appendChild(y("Description")),t})()),n.appendChild((()=>{const t=r("span");return t.appendChild(y("Usage")),t})()),n})()),g(s,()=>(f.value===0?m.core:m.utility).map((n,t)=>(()=>{const a=r("div");return u(a,"style",()=>`
              display: grid; grid-template-columns: 140px 1fr 1fr;
              padding: 1rem 1.5rem;
              border-bottom: ${t<(f.value===0?m.core:m.utility).length-1?`1px solid ${e.border}`:"none"};
              align-items: start;
              transition: background 0.15s;
            `),c(a,"onMouseenter",l=>{l.currentTarget.style.background=e.activeBg}),c(a,"onMouseleave",l=>{l.currentTarget.style.background="transparent"}),a.appendChild((()=>{const l=r("code");return u(l,"style",()=>`
                font-family: ${b.mono}; font-size: 0.875rem;
                color: ${e.accent}; font-weight: 600;
                background: ${e.accentDim};
                padding: 0.2rem 0.5rem; border-radius: 5px;
                display: inline-block;
              `),g(l,()=>n.cmd),l})()),a.appendChild((()=>{const l=r("span");return u(l,"style",()=>`font-size: 0.875rem; color: ${e.textMuted}; padding-right: 1rem; line-height: 1.5`),g(l,()=>n.desc),l})()),a.appendChild((()=>{const l=r("code");return u(l,"style",()=>`
                font-family: ${b.mono}; font-size: 0.78rem;
                color: ${e.textDim}; line-height: 1.6;
                word-break: break-all;
              `),g(l,()=>n.usage),l})()),a})())),s})()),d})()),p})()}const Ce=[[!0,!0,!1,!1,!1],[!0,!1,!1,!1,!1],[!0,!1,!1,!1,!1],[!0,!1,!1,!1,!1],[!0,!1,!1,!1,!1],[!0,!1,!1,!1,!1],[!0,!1,!1,!1,!0]];function $e({lang:o}){const m=C(o).comparison,f=()=>(()=>{const d=r("span");return u(d,"style",()=>`color: ${e.green}; font-size: 1.1rem; font-weight: 700`),d.appendChild(y("✓")),d})(),p=()=>(()=>{const d=r("span");return u(d,"style",()=>`color: ${e.border}; font-size: 1.1rem`),d.appendChild(y("—")),d})();return(()=>{const d=r("section");return c(d,"id","comparison"),u(d,"style",()=>`
      padding: 6rem 2rem;
      background: ${e.bg};
      border-top: 1px solid ${e.border};
    `),d.appendChild((()=>{const s=r("div");return c(s,"style","max-width: 1100px; margin: 0 auto"),s.appendChild((()=>{const n=r("div");return c(n,"style","margin-bottom: 3rem"),n.appendChild((()=>{const t=r("div");return u(t,"style",()=>`
            font-size: 0.8rem; font-weight: 600; color: ${e.accent};
            text-transform: uppercase; letter-spacing: 0.12em;
            margin-bottom: 1rem;
          `),g(t,()=>m.badge),t})()),n.appendChild((()=>{const t=r("h2");return u(t,"style",()=>`
            font-family: ${b.display};
            font-size: clamp(2rem, 4vw, 2.75rem);
            font-weight: 700; letter-spacing: -0.03em;
            color: ${e.text}; margin-bottom: 1rem;
          `),g(t,()=>m.title),t})()),n.appendChild((()=>{const t=r("p");return u(t,"style",()=>`font-size: 1.1rem; color: ${e.textMuted}; line-height: 1.65`),g(t,()=>m.desc),t})()),n})()),s.appendChild((()=>{const n=r("div");return u(n,"style",()=>`
          background: ${e.bgSurface};
          border: 1px solid ${e.border};
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 6px 6px 0 ${e.border};
        `),n.appendChild((()=>{const t=r("div");return u(t,"style",()=>`
            display: grid;
            grid-template-columns: 200px repeat(5, 1fr);
            background: ${e.bgCard};
            border-bottom: 2px solid ${e.border};
          `),t.appendChild((()=>{const a=r("div");return c(a,"style","padding: 1rem 1.5rem"),a})()),g(t,()=>m.tools.map((a,l)=>(()=>{const h=r("div");return u(h,"style",()=>`
                padding: 1rem 0.75rem; text-align: center;
                font-weight: 700; font-size: 0.875rem;
                color: ${l===0?e.accent:e.textMuted};
                font-family: ${l===0?b.mono:b.sans};
                border-left: 1px solid ${e.border};
                background: ${l===0?e.accentDim:"transparent"};
              `),M(h,a),h})())),t})()),g(n,()=>m.features.map((t,a)=>(()=>{const l=r("div");return u(l,"style",()=>`
              display: grid;
              grid-template-columns: 200px repeat(5, 1fr);
              border-bottom: ${a<m.features.length-1?`1px solid ${e.border}`:"none"};
              transition: background 0.15s;
            `),c(l,"onMouseenter",h=>{h.currentTarget.style.background=e.activeBg}),c(l,"onMouseleave",h=>{h.currentTarget.style.background="transparent"}),l.appendChild((()=>{const h=r("div");return u(h,"style",()=>`
                padding: 0.875rem 1.5rem;
                font-size: 0.875rem; font-weight: 500;
                color: ${e.text};
              `),M(h,t),h})()),g(l,()=>Ce[a].map((h,x)=>(()=>{const v=r("div");return u(v,"style",()=>`
                  padding: 0.875rem 0.75rem; text-align: center;
                  border-left: 1px solid ${e.border};
                  background: ${x===0?e.accentDim:"transparent"};
                `),g(v,()=>w(h?()=>f({}):()=>p({}))),v})())),l})())),n})()),s})()),d})()}function ke({lang:o}){const m=C(o).quickstart;return(()=>{const f=r("section");return c(f,"id","quickstart"),u(f,"style",()=>`
      padding: 6rem 2rem;
      background: ${e.bgSurface};
      border-top: 1px solid ${e.border};
    `),f.appendChild((()=>{const p=r("div");return c(p,"style","max-width: 900px; margin: 0 auto"),p.appendChild((()=>{const d=r("div");return c(d,"style","text-align: center; margin-bottom: 4rem"),d.appendChild((()=>{const s=r("div");return u(s,"style",()=>`
            font-size: 0.8rem; font-weight: 600; color: ${e.accent};
            text-transform: uppercase; letter-spacing: 0.12em;
            margin-bottom: 1rem;
          `),g(s,()=>m.badge),s})()),d.appendChild((()=>{const s=r("h2");return u(s,"style",()=>`
            font-family: ${b.display};
            font-size: clamp(2rem, 4vw, 2.75rem);
            font-weight: 700; letter-spacing: -0.03em;
            color: ${e.text};
          `),g(s,()=>m.title),s})()),d})()),p.appendChild((()=>{const d=r("div");return c(d,"style","position: relative"),d.appendChild((()=>{const s=r("div");return u(s,"style",()=>`
            position: absolute; left: 28px; top: 0; bottom: 0;
            width: 2px; background: ${e.border};
          `),s})()),d.appendChild((()=>{const s=r("div");return c(s,"style","display: flex; flex-direction: column; gap: 2rem"),g(s,()=>m.steps.map((n,t)=>(()=>{const a=r("div");return c(a,"style","display: flex; gap: 2rem; align-items: flex-start; position: relative"),a.appendChild((()=>{const l=r("div");return u(l,"style",()=>`
                  width: 58px; height: 58px; flex-shrink: 0;
                  border-radius: 50%;
                  background: ${t===0?e.accent:e.bgCard};
                  border: 2px solid ${t===0?e.accent:e.border};
                  display: flex; align-items: center; justify-content: center;
                  font-family: ${b.mono}; font-size: 0.875rem; font-weight: 700;
                  color: ${t===0?"white":e.textMuted};
                  position: relative; z-index: 1;
                  box-shadow: 0 0 0 4px ${e.bgSurface};
                `),g(l,()=>n.num),l})()),a.appendChild((()=>{const l=r("div");return u(l,"style",()=>`
                  flex: 1;
                  background: ${e.bg};
                  border: 1px solid ${e.border};
                  border-radius: 16px;
                  overflow: hidden;
                  margin-top: 0.5rem;
                `),l.appendChild((()=>{const h=r("div");return u(h,"style",()=>`
                    padding: 0.875rem 1.25rem;
                    background: ${e.bgCard};
                    border-bottom: 1px solid ${e.border};
                    font-weight: 600; font-size: 0.9375rem;
                    color: ${e.text};
                  `),g(h,()=>n.title),h})()),l.appendChild((()=>{const h=r("div");return u(h,"style",()=>`
                    padding: 1rem 1.25rem;
                    background: ${e.codeBg};
                  `),h.appendChild((()=>{const x=r("pre");return u(x,"style",()=>`
                      font-family: ${b.mono}; font-size: 0.85rem;
                      color: ${e.codeText}; line-height: 1.7;
                      white-space: pre-wrap; margin: 0;
                    `),g(x,()=>n.code),x})()),h})()),l})()),a})())),s})()),d})()),p.appendChild((()=>{const d=r("div");return c(d,"style","text-align: center; margin-top: 3.5rem"),d.appendChild((()=>{const s=r("a");return c(s,"href","https://github.com/zelixag/ai-memex-cli#readme"),c(s,"target","_blank"),u(s,"style",()=>`
              display: inline-flex; align-items: center; gap: 0.5rem;
              padding: 0.875rem 2rem; border-radius: 10px;
              border: 2px solid ${e.accent}; background: ${e.accent};
              color: white; font-size: 0.9375rem; font-weight: 600;
              text-decoration: none;
              box-shadow: 4px 4px 0 ${e.accentMuted};
              transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            `),c(s,"onMouseenter",n=>{n.currentTarget.style.transform="translate(-2px, -2px)",n.currentTarget.style.boxShadow=`6px 6px 0 ${e.accentMuted}`}),c(s,"onMouseleave",n=>{n.currentTarget.style.transform="none",n.currentTarget.style.boxShadow=`4px 4px 0 ${e.accentMuted}`}),g(s,()=>m.cta),s.appendChild((()=>{const n=r("svg");return c(n,"width","14"),c(n,"height","14"),c(n,"viewBox","0 0 24 24"),c(n,"fill","none"),c(n,"stroke","currentColor"),c(n,"stroke-width","2.5"),n.appendChild((()=>{const t=r("path");return c(t,"d","M5 12h14M12 5l7 7-7 7"),t})()),n})()),s})()),d})()),p})()),f})()}function Me({lang:o}){const m=C(o).footer,f=["https://github.com/zelixag/ai-memex-cli","https://www.npmjs.com/package/ai-memex-cli","https://github.com/zelixag/ai-memex-cli/issues"];return(()=>{const p=r("footer");return u(p,"style",()=>`
      background: ${e.text};
      padding: 3rem 2rem;
      border-top: 1px solid ${e.border};
    `),p.appendChild((()=>{const d=r("div");return c(d,"style","max-width: 1200px; margin: 0 auto"),d.appendChild((()=>{const s=r("div");return c(s,"style","display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem"),s.appendChild((()=>{const n=r("div");return n.appendChild((()=>{const t=r("div");return c(t,"style","display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem"),t.appendChild((()=>{const a=r("div");return u(a,"style",()=>`
                width: 28px; height: 28px; border-radius: 7px;
                background: ${e.accent};
                display: flex; align-items: center; justify-content: center;
                font-family: ${b.mono}; font-size: 0.7rem; font-weight: 500;
                color: white;
              `),a.appendChild(y("mx")),a})()),t.appendChild((()=>{const a=r("span");return u(a,"style",()=>`
                font-family: ${b.mono}; font-size: 0.875rem; font-weight: 500;
                color: ${e.bg}; opacity: 0.9;
              `),a.appendChild(y("ai-memex-cli")),a})()),t})()),n.appendChild((()=>{const t=r("p");return u(t,"style",()=>`font-size: 0.875rem; color: ${e.bg}; opacity: 0.55; max-width: 320px; line-height: 1.5`),g(t,()=>m.tagline),t})()),n})()),s.appendChild((()=>{const n=r("div");return c(n,"style","display: flex; gap: 1.5rem; align-items: center"),g(n,()=>m.links.map((t,a)=>(()=>{const l=r("a");return u(l,"href",()=>f[a]),c(l,"target","_blank"),u(l,"style",()=>`
                  font-size: 0.875rem; color: ${e.bg}; opacity: 0.6;
                  text-decoration: none; transition: opacity 0.2s;
                `),c(l,"onMouseenter",h=>{h.target.style.opacity="1"}),c(l,"onMouseleave",h=>{h.target.style.opacity="0.6"}),M(l,t),l})())),n})()),s})()),d.appendChild((()=>{const s=r("div");return u(s,"style",()=>`
          margin-top: 2rem; padding-top: 1.5rem;
          border-top: 1px solid rgba(245, 240, 232, 0.1);
          font-size: 0.8rem; color: ${e.bg}; opacity: 0.4;
          text-align: center;
        `),g(s,()=>m.copyright),s})()),d})()),p})()}me();function ze(){const o=S(ue()),i=S(K()),m=()=>{o=o.value==="en"?"zh":"en",fe(o.value),document.documentElement.setAttribute("lang",o.value==="zh"?"zh-CN":"en")},f=()=>{i=pe()};return(()=>{const p=r("div");return u(p,"style",()=>`min-height: 100vh; background: ${e.bg}; color: ${e.text}`),p.appendChild(w(()=>ge({lang:o.value,theme:i.value,onToggleLang:m,onToggleTheme:f}))),p.appendChild(w(()=>be({lang:o.value}))),p.appendChild(w(()=>_e({lang:o.value}))),p.appendChild(w(()=>ve({lang:o.value}))),p.appendChild(w(()=>we({lang:o.value}))),p.appendChild(w(()=>$e({lang:o.value}))),p.appendChild(w(()=>ke({lang:o.value}))),p.appendChild(w(()=>Me({lang:o.value}))),p})()}ne(ze,"#app");
