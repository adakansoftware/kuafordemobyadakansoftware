import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "Bella Sac & Guzellik Salonu | Premium Sac Bakim Hizmetleri",
  description:
    "Istanbul'un kalbinde premium sac bakim ve guzellik hizmetleri. Uzman ekibimizle sac kesim, boyama, keratin bakimi ve daha fazlasi.",
  keywords: [
    "kuafor",
    "sac bakim",
    "guzellik salonu",
    "istanbul",
    "sac kesim",
    "sac boyama",
    "keratin",
  ],
}

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
