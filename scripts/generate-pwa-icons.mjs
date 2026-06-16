import { mkdir, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"
import toIco from "to-ico"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const sourcePath = join(root, "public", "vizb-logo.png")
const background = { r: 0, g: 0, b: 0, alpha: 1 }

/**
 * Composite the ViZb wordmark onto a square black canvas.
 * @param {number} size - Canvas edge length in px
 * @param {number} logoWidthPercent - Wordmark max width as fraction of canvas (0–1)
 */
async function composeIcon(size, logoWidthPercent) {
  const logoMaxWidth = Math.round(size * logoWidthPercent)
  const sourceMeta = await sharp(sourcePath).metadata()
  const scaledHeight = Math.round(logoMaxWidth * (sourceMeta.height / sourceMeta.width))

  const resizedLogo = await sharp(sourcePath)
    .resize(logoMaxWidth, scaledHeight, { fit: "inside" })
    .toBuffer()

  const resizedMeta = await sharp(resizedLogo).metadata()
  const left = Math.round((size - resizedMeta.width) / 2)
  const top = Math.round((size - resizedMeta.height) / 2)

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toBuffer()
}

async function writeIcon(relativePath, size, logoWidthPercent) {
  const buffer = await composeIcon(size, logoWidthPercent)
  const fullPath = join(root, relativePath)
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, buffer)
  const meta = await sharp(buffer).metadata()
  console.log(`Wrote ${relativePath} (${meta.width}x${meta.height}, ${meta.channels}ch)`)
  return buffer
}

async function main() {
  const sourceMeta = await sharp(sourcePath).metadata()
  console.log(
    `Source: public/vizb-logo.png (${sourceMeta.width}x${sourceMeta.height}, ${sourceMeta.channels}ch)`,
  )

  if (sourceMeta.channels !== 4) {
    console.warn("Warning: source logo is not RGBA — re-export with alpha for best results.")
  }

  await writeIcon("public/pwa/icon-192.png", 192, 0.7)
  await writeIcon("public/pwa/icon-512.png", 512, 0.7)
  await writeIcon("public/pwa/icon-512-maskable.png", 512, 0.55)
  await writeIcon("public/apple-icon.png", 180, 0.7)
  await writeIcon("public/favicon-32x32.png", 32, 0.7)

  const favicon16 = await composeIcon(16, 0.7)
  const favicon32 = await composeIcon(32, 0.7)
  const ico = await toIco([favicon16, favicon32])
  await writeFile(join(root, "public", "favicon.ico"), ico)
  console.log("Wrote public/favicon.ico (16+32)")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
