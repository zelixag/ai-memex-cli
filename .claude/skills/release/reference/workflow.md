# Release workflow — full timing diagram

```
                   ┌──────────────────────────────────────────────────┐
                   │              pnpm release [flags]                │
                   │             (orchestrator.mjs)                   │
                   └──────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. preflight                                                            │
│   git/branch/clean·node≥20·pnpm·claude·gh auth·pnpm whoami              │
│   summary → currentVersion · lastTag · commitsSinceLastTag · npmUser    │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3·peek (dry-run)                                                        │
│   compute newVersion before phase 2 so the agent can write the          │
│   `## v0.3.0` heading in CHANGELOG.md correctly                         │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │  USER CONFIRM bump      │
                          └────────────┬────────────┘
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. sync-docs        claude -p                                           │
│   edits CHANGELOG.md, README.md, README.zh-CN.md,                       │
│         website/client/src/{i18n,components}                            │
│   ⚠ does NOT touch package.json / dist/ / docs/ build output            │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │  USER REVIEW agent diff │
                          └────────────┬────────────┘
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. bump-version                                                         │
│   writes package.json with the new version                              │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. build-all                                                            │
│   pnpm build (always)                                                   │
│   if website/client/src/ changed in phase 2 →                           │
│     cd website && pnpm install --frozen-lockfile && pnpm build:gh-pages │
│   ⇒ docs/index.html + docs/assets/** rewritten                          │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. test             pnpm test:run    (--skip to bypass)                 │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 6. pack-preview     pnpm pack --dry-run                                 │
│   audit: required files present? forbidden patterns absent?             │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │  USER REVIEW tarball    │
                          └────────────┬────────────┘
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 7. git-finalize                                                         │
│   git add -A; git commit -m "release: vX.Y.Z"; git tag vX.Y.Z           │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 8. publish                                                              │
│   stable: pnpm publish --no-git-checks --access public --tag latest     │
│   beta:   pnpm publish --no-git-checks --access public --tag beta       │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │  USER CONFIRM push      │
                          └────────────┬────────────┘
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 9. git-push         git push origin HEAD && git push origin vX.Y.Z      │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 10. github-release  (stable only)                                       │
│   slice CHANGELOG.md `## vX.Y.Z` section → /tmp/notes.md                │
│   gh release create vX.Y.Z --title vX.Y.Z --notes-file /tmp/notes.md    │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 11. verify                                                              │
│   pnpm view ai-memex-cli@X.Y.Z version === X.Y.Z                        │
│   pnpm view ai-memex-cli dist-tags.<tag> === X.Y.Z                      │
│   stable: gh release view vX.Y.Z (must exist)                           │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                              ✔ Released vX.Y.Z
```

## What dry-run does

| Phase | dry-run behavior                                            |
|-------|-------------------------------------------------------------|
| 1     | runs (read-only anyway)                                     |
| 3·peek| runs (computes only, doesn't write)                         |
| 2     | runs — agent makes real doc edits (so user can review)      |
| 3     | computes only, doesn't write package.json                   |
| 4     | skipped (no fresh dist/ in dry-run)                         |
| 5     | runs                                                        |
| 6     | skipped (no fresh dist/ to inspect)                         |
| 7     | skipped                                                     |
| 8     | adds `--dry-run` flag → server-side validation, no upload   |
| 9     | skipped                                                     |
| 10    | skipped (still validates the changelog slice)               |
| 11    | skipped                                                     |

dry-run leaves your working tree dirty with the agent's doc edits. Either commit them yourself or `git stash` / `git restore` if you don't want them.
