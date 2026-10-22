import type { Config, Context } from "@netlify/edge-functions";
import { decideRoute } from "./lib/routing-rules.ts";
import { APP_ROUTE_PATTERNS, PASS_THROUGH_ROUTE_PATTERNS } from "./lib/known-routes.generated.ts";

/**
 * Server-side trailing-slash 301s for crawlers (the client TrailingSlashRedirect only runs after JS):
 * /metrics/foo → 301 /metrics/foo/, only for routes the SPA actually renders.
 * Netlify redirect rules ignore trailing slashes, so this cannot live in _redirects.
 * Real 404s come from the static layer: dist/_redirects only rewrites known routes to the
 * SPA, everything else falls through to dist/404.html (see scripts/generate-route-manifest.mjs).
 */
export default (request: Request, _context: Context) => {
    const url = new URL(request.url);
    const decision = decideRoute(url.pathname, APP_ROUTE_PATTERNS, PASS_THROUGH_ROUTE_PATTERNS);
    if (decision.type !== "redirect") return;
    return new Response(null, {
        status: 301,
        headers: { Location: `${decision.location}${url.search}` },
    });
};

export const config: Config = {
    path: "/*",
    excludedPath: ["/assets/*", "/api/*"],
    onError: "bypass",
};
