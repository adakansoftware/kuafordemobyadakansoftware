import type { MetadataRoute } from "next"
import { siteContent } from "@/lib/site-content"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteContent.brand.name,
    short_name: siteContent.brand.shortName,
    description: siteContent.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#171411",
    theme_color: "#171411",
    lang: "tr-TR",
    icons: [
      {
        src: "/icon-light-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
