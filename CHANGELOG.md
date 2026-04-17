# Changelog

本文件由 [changelogen](https://github.com/unjs/changelogen) 根据 [Conventional Commits](https://www.conventionalcommits.org/) 生成。发版前执行 `pnpm release`（或 `release:minor` / `release:major`）会递增版本、更新本文件并创建 git 提交与标签。

**首次增量发版前（只需一次）**：在当前基线提交上打标签，之后新版本只会统计该标签之后的提交：`git tag v0.1.0` 并 `git push origin v0.1.0`（若尚未打过 `v0.1.0`）。

## v0.1.0


### 🚀 Enhancements

- Initial implementation of memex CLI ([59b0386](https://github.com/zelixag/ai-memex-cli/commit/59b0386))
- Add `memex fetch` command with built-in crawler and agent mode ([c91eab2](https://github.com/zelixag/ai-memex-cli/commit/c91eab2))
- Install-hooks generates slash commands for all major agents ([1c30e25](https://github.com/zelixag/ai-memex-cli/commit/1c30e25))
- Memex onboard — interactive setup wizard ([916705d](https://github.com/zelixag/ai-memex-cli/commit/916705d))
- Memex update — self-update command ([323d7d3](https://github.com/zelixag/ai-memex-cli/commit/323d7d3))
- TDD overhaul — 84 tests, input validation for all commands, edge case fixes ([7b7b5d5](https://github.com/zelixag/ai-memex-cli/commit/7b7b5d5))
- Memex fetch supports keyword search — auto-detect URL vs keywords, DuckDuckGo search, interactive selection, agent search mode ([357282d](https://github.com/zelixag/ai-memex-cli/commit/357282d))
- Add React docs website source + rebuild GitHub Pages with React ([382f38c](https://github.com/zelixag/ai-memex-cli/commit/382f38c))

### 🩹 Fixes

- Search now covers raw/ + wiki/, guard empty query ([5b9f6e9](https://github.com/zelixag/ai-memex-cli/commit/5b9f6e9))
- Vault auto-detection when cwd is inside .llmwiki directory ([6384ba4](https://github.com/zelixag/ai-memex-cli/commit/6384ba4))
- Set base=/ai-memex-cli/ for GitHub Pages asset paths ([c5ad13a](https://github.com/zelixag/ai-memex-cli/commit/c5ad13a))
- Remove debug-collector script from production build ([f5bd9ea](https://github.com/zelixag/ai-memex-cli/commit/f5bd9ea))
- Use wouter Router base path to fix GitHub Pages routing ([fc6cd77](https://github.com/zelixag/ai-memex-cli/commit/fc6cd77))
- Update image CDN URLs to new cloudfront addresses ([9b48a6c](https://github.com/zelixag/ai-memex-cli/commit/9b48a6c))

### 💅 Refactors

- ⚠️  Complete rewrite — TypeScript/cac/stateless architecture ([078aa9c](https://github.com/zelixag/ai-memex-cli/commit/078aa9c))

### 📖 Documentation

- Rewrite README with competitive positioning, full command reference, and architecture overview ([250908a](https://github.com/zelixag/ai-memex-cli/commit/250908a))
- Update competitive analysis in README to include atomicmemory and ussumant llm-wiki-compiler implementations ([8f0b622](https://github.com/zelixag/ai-memex-cli/commit/8f0b622))
- Update README with all new commands (fetch keywords, onboard wizard, update, config) ([d100eb1](https://github.com/zelixag/ai-memex-cli/commit/d100eb1))
- Add GitHub Pages documentation website ([3a9dab7](https://github.com/zelixag/ai-memex-cli/commit/3a9dab7))
- Replace images with custom illustrations ([46c4faf](https://github.com/zelixag/ai-memex-cli/commit/46c4faf))
- Rebuild with Aether framework + zh/en i18n support ([72bc6f4](https://github.com/zelixag/ai-memex-cli/commit/72bc6f4))

### 🏡 Chore

- Rename project to ai-memex-cli ([e187381](https://github.com/zelixag/ai-memex-cli/commit/e187381))
- Add npm publish metadata (repository, homepage, files, author) ([7d95da5](https://github.com/zelixag/ai-memex-cli/commit/7d95da5))
- Clean up website files and update .gitignore ([48c82cf](https://github.com/zelixag/ai-memex-cli/commit/48c82cf))

#### ⚠️ Breaking Changes

- ⚠️  Complete rewrite — TypeScript/cac/stateless architecture ([078aa9c](https://github.com/zelixag/ai-memex-cli/commit/078aa9c))

### ❤️ Contributors

- Zhenglinxiong <zhenglinxiong@xmov.ai>
- Zelixag ([@zelixag](https://github.com/zelixag))

