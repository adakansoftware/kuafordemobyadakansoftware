import { fileURLToPath } from "node:url"

const rootDir = fileURLToPath(new URL(".", import.meta.url))

function getSecurityHeaders() {
  return [
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    },
    {
      key: "Cross-Origin-Resource-Policy",
      value: "same-origin",
    },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "img-src 'self' data: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "script-src 'self' 'unsafe-inline'",
        "connect-src 'self'",
        "frame-src 'self' https://www.google.com https://www.google.com.tr",
      ].join("; "),
    },
  ]
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: rootDir,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders(),
      },
    ]
  },
}

export default nextConfig
