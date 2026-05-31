# 100x

> AI ad creative studio for DTC sellers — paste a product URL, get 8 platform-ready ads in under a minute.

🌐 **Live:** [100x.pics](https://100x.pics) · [100pics.today](https://100pics.today)

`#2026AIAgent清客松`

---

## What it does

1. **Paste any product URL** — Shopify, Amazon, your own DTC site
2. **AI scrapes the page** — product info, brand, images, keywords
3. **AI recommends scenes** — 8 ad scenes tailored to your product category (smart ring → sleep / gym; espresso machine → kitchen / cafe)
4. **One-click generate** — produces 8 ads sized for Instagram Feed / Story, TikTok, Pinterest, YouTube, Facebook Banner, etc.
5. **Refine in place** — natural-language edits ("make it warmer", "add morning light")

Built for the 30-min creative refresh, not the 3-day shoot.

## Stack

- **Next.js 16** (App Router, RSC, server actions)
- **NextAuth v5** — auth with email + invite codes
- **Prisma + SQLite/Postgres** — user, quota, config
- **Tailwind + shadcn/ui** — dark, gradient-heavy UI
- **Vercel Blob** — persistent generated image storage
- **OpenAI-compatible LLMs** for copy + scene planning
- **Image gen pipeline** with reference-image conditioning for product fidelity

## Local dev

```bash
git clone https://github.com/KevPH2026/100x.git
cd 100x
npm install
cp .env.example .env.local   # fill in your keys
npx prisma db push
npm run dev
```

## Env vars

```
# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=file:./dev.db

# LLM (chat / planning)
LLM_TEXT_API_KEY=
LLM_TEXT_BASE_URL=https://api.openai.com/v1
COPY_MODEL=gpt-4o-mini
SCENE_MODEL=gpt-4o-mini

# Image generation
TOKENROUTER_API_KEY=
TOKENROUTER_BASE_URL=https://api.tokenrouter.com/v1

# Storage
BLOB_READ_WRITE_TOKEN=

# Admin
ADMIN_PASSWORD=
```

## Architecture

```
URL  ─►  /api/scrape          extract product info + images
    ─►  /api/brand-dna        extract color palette / mood
    ─►  /api/recommend-scenes 8 scenes tailored to product category
    ─►  /api/copywrite        headline / body / CTA variants
    ─►  /api/adforge          per-scene image gen (ref-image conditioned)
    ─►  /api/adforge/refine   natural-language edits
```

All API keys live server-side. Frontend never sees a secret.

## License

Private. All rights reserved.
