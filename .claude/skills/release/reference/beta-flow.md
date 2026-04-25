# Beta channel

Beta releases let you publish iteration candidates without disturbing the `latest` npm tag (so `npm i ai-memex-cli` still pulls the last stable version).

## Version state machine

```
   stable 0.2.0
        │
        │ pnpm release --bump prepatch --beta
        ▼
   beta 0.2.1-beta.0
        │
        │ pnpm release --beta             (continues numbering)
        ▼
   beta 0.2.1-beta.1
        │
        │ pnpm release --beta
        ▼
   beta 0.2.1-beta.2
        │
        │ pnpm release --bump release    (graduate to stable)
        ▼
   stable 0.2.1
```

Other entry points:

```
stable 0.2.0
    │
    │ pnpm release --bump preminor --beta    →  0.3.0-beta.0
    │ pnpm release --bump premajor --beta    →  1.0.0-beta.0
    └────────────────────────────────────────────────────────
```

## What is different from stable

| Step                  | stable                    | beta                              |
|-----------------------|---------------------------|-----------------------------------|
| package.json version  | `0.3.0`                   | `0.3.0-beta.0`                    |
| git commit            | `release: v0.3.0`         | `release: v0.3.0-beta.0`          |
| git tag               | `v0.3.0`                  | `v0.3.0-beta.0`                   |
| `pnpm publish --tag`  | `latest` (default)        | `beta`                            |
| GitHub Release        | **created**               | **skipped**                       |
| `npm i ai-memex-cli`  | gets the new version      | unchanged (still last stable)     |
| explicit install      | —                         | `npm i ai-memex-cli@beta`         |

## Why no GitHub Release for beta

GitHub Releases show up in the repo's "Releases" sidebar and Atom feed; they're a publishing event you'd advertise. Beta versions are continuation prototypes — you'd flood the feed with `beta.0`...`beta.7` noise. The git tag is enough; if a beta turns out important, you can always run `gh release create vX.Y.Z-beta.N --prerelease --notes-from-tag` manually.

## Common operations

```bash
# Start a beta cycle off current stable
pnpm release --bump prepatch --beta
# → 0.2.0 → 0.2.1-beta.0, npm tag beta, no gh release

# Iterate on the beta
pnpm release --beta
# → 0.2.1-beta.0 → 0.2.1-beta.1

# Promote the beta to stable
pnpm release --bump release
# → 0.2.1-beta.5 → 0.2.1, npm tag latest, gh release created

# Skip beta and ship the stable patch directly
pnpm release --bump patch
# (works whether current version is stable or beta — `patch` from a beta
#  drops the prerelease suffix without bumping again)
```

## What if I'm currently on `0.3.0-beta.2` and want to publish `0.3.0` stable?

`pnpm release --bump release` is the right move. It strips the prerelease suffix (`0.3.0-beta.2` → `0.3.0`), publishes with `--tag latest`, and creates the GitHub Release.

## What if a beta is broken and shouldn't appear?

You can't unpublish from npm after 72h. You can `pnpm dist-tag rm ai-memex-cli@<beta-version> beta` to point the `beta` tag at a different version, and you can `npm deprecate` the bad version with a message. See `reference/rollback.md`.
