import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

/**
 * Sitelinks-searchbox schema for the homepage's search dock. `query-input`
 * only supports a single free-text placeholder, but a bus search needs two
 * resolved stop IDs (see /api/stops/search) — so this maps the one
 * placeholder to `destinationLabel` on the real `/search` route rather than
 * a `/curse/[from]/[to]` page, which doesn't exist in the app. Building that
 * as a real two-variable SEO landing page (not just a JSON-LD target) would
 * be a separate feature in its own right.
 */
const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BUSX",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?destinationLabel={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BUSX",
  description: "Platformă de rezervare a călătoriilor interurbane cu autocarul, de nouă generație",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${jakarta.variable} ${mono.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
