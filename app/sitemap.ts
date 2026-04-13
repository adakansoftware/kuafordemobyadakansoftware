import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/hizmetler", "/hakkimizda", "/randevu"]
  const lastModified = new Date("2026-04-13T00:00:00.000Z")

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }))
}
