import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/hizmetler", "/hakkimizda", "/randevu"]

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }))
}
