import { defineConfig } from "vitepress";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const base = isGitHubActions ? "/tyneq/" : "/";

function buildApiSidebar() {
  const navFile = resolve(__dir, "../api/reference/navigation.json");

  if (!existsSync(navFile)) {
    return [{ text: "Overview", link: "/api/reference/" }];
  }

  const groups = JSON.parse(readFileSync(navFile, "utf8")) as Array<{
    title: string;
    children: Array<{ title: string; path: string }>;
  }>;

  return [
    { text: "Overview", link: "/api/reference/" },
    ...groups.map(group => ({
      text: group.title,
      collapsed: true,
      items: group.children.map(entry => ({
        text: entry.title,
        link: `/api/reference/${entry.path.replace(/\.md$/, "")}`
      }))
    }))
  ];
}

export default defineConfig({
  title: "Tyneq",
  description: "Typed Enumerable Queries for TypeScript",
  base,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: `${base}logo.svg` }]
  ],
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Tyneq",
    search: {
      provider: "local"
    },
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Reference", link: "/api/reference/" },
      { text: "GitHub", link: "https://github.com/chrisitopherus/tyneq" }
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Overview", link: "/guide/" },
            { text: "What Is Tyneq", link: "/guide/what-is-tyneq" },
            { text: "Getting Started", link: "/guide/getting-started" }
          ]
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Core Concepts", link: "/guide/concepts" },
            { text: "Operators Overview", link: "/guide/operators-overview" },
            { text: "Queries & Deferred Execution", link: "/guide/querying-and-deferred-execution" }
          ]
        },
        {
          text: "Guides",
          items: [
            { text: "Examples", link: "/guide/examples" },
            { text: "Error Handling", link: "/guide/error-handling" },
            { text: "Common Pitfalls", link: "/guide/pitfalls" },
            { text: "vs. Other Libraries", link: "/guide/differences" }
          ]
        },
        {
          text: "Extending Tyneq",
          items: [
            { text: "Custom Operators", link: "/guide/extensibility" },
            { text: "Building Custom Enumerators", link: "/guide/custom-enumerators" },
            { text: "Query Plan Inspection", link: "/guide/query-plan" }
          ]
        },
        {
          text: "Contributing",
          items: [
            { text: "Contributor Guide", link: "/guide/contributing" },
            { text: "Docs Maintenance", link: "/guide/documentation-maintenance" }
          ]
        }
      ],
      "/api/": buildApiSidebar()
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/chrisitopherus/tyneq" }
    ]
  }
});
