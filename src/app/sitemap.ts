import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { routes } from "@/lib/constants/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    routes.home,
    routes.login,
    routes.register,
    routes.dashboard,
    `${routes.trading}/BTC-USD`,
    routes.wallet,
    routes.orders,
    routes.settings,
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
  }));
}
