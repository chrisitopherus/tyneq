import { defineConfig } from "vitepress";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  title: "Tyneq",
  description: "Typed Enumerable Queries for TypeScript",
  base: isGitHubActions ? "/tyneq/" : "/",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    siteTitle: "Tyneq Docs",
    search: {
      provider: "local"
    },
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" }
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "Overview", link: "/guide/" },
            { text: "What is Tyneq", link: "/guide/what-is-tyneq" },
            { text: "Core Concepts", link: "/guide/concepts" },
            { text: "Differences", link: "/guide/differences" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Queries & Deferred Execution", link: "/guide/querying-and-deferred-execution" },
            { text: "Examples", link: "/guide/examples" },
            { text: "Docs Maintenance", link: "/guide/documentation-maintenance" }
          ]
        }
      ],
      "/api/": [
        {
          text: "API",
          items: [
            { text: "API Overview", link: "/api/" },
            { text: "Generated Reference", link: "/api/reference/" }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/chrisitopherus/tyneq" }
    ]
  }
});
