import type { MetadataRoute } from "next"
import {
  PWA_ICON_192_SRC,
  PWA_ICON_512_SRC,
  PWA_ICON_MASKABLE_SRC,
} from "@/lib/brand-assets"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VIZB | Virginia Isn't Boring",
    short_name: "ViZb",
    description:
      "Virginia Isn't Boring — discover better events, better people, and better energy across Virginia.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#0D40FF",
    icons: [
      {
        src: PWA_ICON_192_SRC,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICON_512_SRC,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICON_MASKABLE_SRC,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
