import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default nextConfig
