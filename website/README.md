# ai-memex-cli Documentation Website

This directory contains the source code for the [ai-memex-cli documentation website](https://zelixag.github.io/ai-memex-cli/).

## Stack

- **React 19** + **TypeScript**
- **Vite** for bundling
- **Tailwind CSS v4** for styling
- **shadcn/ui** for UI components
- **Wouter** for client-side routing

## Design Theme

Warm editorial aesthetic inspired by antique cartography:
- **Fonts**: Playfair Display (display) + Crimson Pro (body) + JetBrains Mono (code)
- **Colors**: Parchment ivory, terracotta, sage green, aged gold
- **Motifs**: Ornamental dividers, hand-drawn illustration style

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production (GitHub Pages)
VITE_BASE=/ai-memex-cli/ pnpm build --outDir=../docs
```

## Deployment

The site is deployed to GitHub Pages from the `/docs` directory of the main branch.

After building, the output is placed in `../docs/` and committed to trigger a GitHub Pages deployment.

## Images

All images are hosted on CloudFront CDN. The original source files are:
- `hero-map.png` — Hero section knowledge map illustration
- `architecture-diagram.png` — System architecture three-layer diagram
- `feature-fetch.png` — Web crawler illustration (steampunk spider)
- `feature-distill.png` — Distillation alembic illustration
- `feature-agents.png` — Compass rose with agent icons illustration
