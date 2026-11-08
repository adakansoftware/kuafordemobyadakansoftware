export { siteContent } from "./content/index.ts"
export type { NavLink, Service, Testimonial } from "./content/types.ts"

import { siteContent as trContent } from "./content/tr.ts"

export function getServiceBySlug(slug: string) {
  return trContent.services.find((service) => service.slug === slug)
}
