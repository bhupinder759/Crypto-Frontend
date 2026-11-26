export const siteConfig = {
  name: "Nexfin Exchange",
  shortName: "Nexfin",
  description:
    "Spot crypto exchange with a pro trading terminal, live order books and demo trading.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    docs: "#",
    support: "#",
  },
} as const;
