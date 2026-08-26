/**
 * No production domain is configured anywhere in this repo yet (no
 * `NEXT_PUBLIC_SITE_URL`, no `.vercel` project link). `https://busx.ro` is a
 * placeholder — set the real env var once the app has a deployed domain, or
 * every absolute URL emitted from this (JSON-LD, OG tags, sitemaps) will
 * point at a domain nobody owns.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://busx.ro";
