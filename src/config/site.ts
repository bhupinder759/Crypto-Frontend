export const siteConfig = {
  name: "Nexfin Exchange",
  shortName: "Nexfin",
  description:
    "Enterprise crypto exchange frontend built on Next.js for trading, wallets, orders, and market operations.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ogImage: "/og-image.png",
  links: {
    docs: "#",
    support: "#",
  },
} as const;
