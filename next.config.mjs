import { withSentryConfig } from "@sentry/nextjs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Playwright runs against 127.0.0.1; Next dev blocks cross-origin dev resources unless listed.
  allowedDevOrigins: ["127.0.0.1"],
  // Flyer uploads use Server Actions with multipart bodies; default limit is 1MB.
  // Keep this above app max file size (5MB) plus multipart overhead — see lib/events/flyer-upload-constraints.ts.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  // Pin workspace root when another lockfile exists higher in the tree (e.g. user home).
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
