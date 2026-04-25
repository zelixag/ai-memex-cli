# 设计文档

这个目录存放 agent-native 版本 ai-memex 迭代的源设计文档。

这些文件不是生成后的网站产物，而是用于控制产品方向、架构决策和迁移任务的工作文档。

## 阅读顺序

1. [`agent-native-iteration-plan.zh-CN.md`](./agent-native-iteration-plan.zh-CN.md)
   - 产品方向和迭代目标。
   - 定义从 CLI-first 到 agent-native 的转向。

2. [`agent-native-architecture.zh-CN.md`](./agent-native-architecture.zh-CN.md)
   - 三层架构：Agent Interface、Workflow Protocol、CLI Toolbox。
   - 按未来归属对现有命令分类。

3. [`skill-mvp-spec.zh-CN.md`](./skill-mvp-spec.zh-CN.md)
   - 第一版 `ai-memex` agent skill 的规格。
   - 定义触发意图、引用文件、安全门和验收标准。

4. [`slash-command-spec.zh-CN.md`](./slash-command-spec.zh-CN.md)
   - 第一版 `/memex:*` 命令契约。
   - 保持 slash commands 轻量，并由 skill 承载主要逻辑。

5. [`migration-tasks.zh-CN.md`](./migration-tasks.zh-CN.md)
   - 设计、Skill MVP、slash commands、CLI 收敛、文档和验证的执行清单。

## 当前方向

当前有效决策是：

> AI Memex 是一个 agent-native 的 LLM wiki 工作流，由 CLI 工具箱提供底层支撑。

CLI 仍然是确定性的支持层。Agent skill 成为主要工作流入口。

