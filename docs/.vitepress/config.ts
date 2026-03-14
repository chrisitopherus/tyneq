import { defineConfig } from "vitepress";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  title: "Tyneq",
  description: "Typed Enumerable Queries for TypeScript",
  base: isGitHubActions ? "/tyneq/" : "/",
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: isGitHubActions ? "/tyneq/logo.svg" : "/logo.svg" }]
  ],
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Tyneq",
    search: {
      provider: "local"
    },
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" },
      { text: "Contributing", link: "/guide/contributing" }
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
            { text: "vs. Other Libraries", link: "/guide/differences" }
          ]
        },
        {
          text: "Extending Tyneq",
          items: [
            { text: "Extensibility & Query Plans", link: "/guide/extensibility" }
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
