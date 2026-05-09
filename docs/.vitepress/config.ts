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
  description: "Lazy query pipelines for TypeScript. LINQ-expressive, type-safe, and infinitely extensible.",
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
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/api/reference/" },
      { text: "GitHub", link: "https://github.com/chrisitopherus/tyneq" }
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Start Here",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Core Concepts", link: "/guide/concepts" },
            { text: "Best Practices & Pitfalls", link: "/guide/best-practices" }
          ]
        },
        {
          text: "Using Tyneq",
          items: [
            { text: "Operators", link: "/guide/operators" },
            { text: "Ordering", link: "/guide/ordering" },
            { text: "Grouping & Joins", link: "/guide/grouping" },
            { text: "Set Operations", link: "/guide/set-operations" }
          ]
        },
        {
          text: "Extending Tyneq",
          items: [
            { text: "Custom Operators", link: "/guide/extensibility" },
            { text: "Plugin Internals", link: "/guide/plugin-internals" }
          ]
        },
        {
          text: "Diving Deeper",
          items: [
            { text: "Query Plan & Compiler", link: "/guide/query-plan" },
            { text: "Terminology", link: "/guide/terminology" }
          ]
        },
        {
          text: "Project",
          items: [
            { text: "Contributing", link: "/guide/contributing" }
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
