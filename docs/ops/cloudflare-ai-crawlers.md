# Cloudflare AI crawler policy (align with `public/robots.txt`)

**Product lock (2026-07-25):** Answer engines **yes**, training **no**.

## Goal

- Allow: Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-Web, PerplexityBot, YouBot, Applebot
- Block: GPTBot (training), Google-Extended, ClaudeBot (training crawl), CCBot, Bytespider, Amazonbot, meta-externalagent, Applebot-Extended

## Why this doc exists

Live `robots.txt` previously showed **Cloudflare Managed Content** Disallowing many AI bots, then a later custom group Allowing the same bots. That conflict is undefined for crawlers. Repo `public/robots.txt` is the source of truth for deploy; CF must not reverse it.

## Ops checklist

1. Cloudflare dashboard → domain → **Security** → **Bots** / **AI Crawl Control** (wording varies by plan).
2. Disable or customize managed AI blocklists so they match the product lock above.
3. After change: `curl -s https://graphiquestor.com/robots.txt | head -80` and confirm no contradictory Allow/Disallow for the same User-agent that undoes train=no / search=yes.
4. Content-Signal (if CF injects): prefer `search=yes, ai-train=no`.

## Related

- `public/robots.txt`
- `public/llms.txt`, `public/llm.txt`
- CEO SEO plan: answer engines yes / training no
