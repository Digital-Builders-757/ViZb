"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 50

    // Performance: Disable antialiasing for better FPS
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
    renderer.setSize(width, height)
    // Performance: Cap pixel ratio to reduce GPU work on high-DPI displays
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // Performance: Reduced particle count from 2000 to 800
    const particleCount = 800
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    // Color palette - neon blues
    const colorPalette = [
      new THREE.Color("#0D40FF"),
      new THREE.Color("#0C74E8"),
      new THREE.Color("#00BDFF"),
      new THREE.Color("#00E5FF"),
    ]

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      // Spread particles in a wave pattern
      positions[i3] = (Math.random() - 0.5) * 100
      positions[i3 + 1] = (Math.random() - 0.5) * 100
      positions[i3 + 2] = (Math.random() - 0.5) * 50

      // Random color from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Create glowing lines/connections
    const lineGeometry = new THREE.BufferGeometry()
    const linePositions = new Float32Array(100 * 6)
    const lineColors = new Float32Array(100 * 6)

    for (let i = 0; i < 100; i++) {
      const i6 = i * 6
      const x1 = (Math.random() - 0.5) * 80
      const y1 = (Math.random() - 0.5) * 80
      const z1 = (Math.random() - 0.5) * 40

      linePositions[i6] = x1
      linePositions[i6 + 1] = y1
      linePositions[i6 + 2] = z1
      linePositions[i6 + 3] = x1 + (Math.random() - 0.5) * 20
      linePositions[i6 + 4] = y1 + (Math.random() - 0.5) * 20
      linePositions[i6 + 5] = z1 + (Math.random() - 0.5) * 10

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      lineColors[i6] = color.r
      lineColors[i6 + 1] = color.g
      lineColors[i6 + 2] = color.b
      lineColors[i6 + 3] = color.r
      lineColors[i6 + 4] = color.g
      lineColors[i6 + 5] = color.b
    }

    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3))
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3))

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    })

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lines)

    // Mouse interaction with throttling
    const mouse = { x: 0, y: 0 }
    let lastMouseMove = 0
    const handleMouseMove = (event: MouseEvent) => {
      // Performance: Throttle mouse updates to ~60fps
      const now = performance.now()
      if (now - lastMouseMove < 16) return
      lastMouseMove = now
      mouse.x = (event.clientX / width) * 2 - 1
      mouse.y = -(event.clientY / height) * 2 + 1
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    // Performance: Track visibility to pause when tab is hidden
    let isVisible = true
    let animationId: number

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible"
      if (isVisible && !animationId) {
        clock.start()
        animate()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Animation
    const clock = new THREE.Clock()

    const animate = () => {
      // Performance: Stop animation when tab is hidden
      if (!isVisible) {
        animationId = 0
        return
      }

      const elapsedTime = clock.getElapsedTime()

      // Performance: Update particles less frequently (every other frame approx)
      const positions = particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i += 2) {
        const i3 = i * 3
        const x = positions[i3]
        positions[i3 + 1] += Math.sin(elapsedTime + x * 0.1) * 0.02
      }
      particles.geometry.attributes.position.needsUpdate = true

      // Rotate based on mouse
      particles.rotation.x = mouse.y * 0.1
      particles.rotation.y = mouse.x * 0.1
      lines.rotation.x = mouse.y * 0.05
      lines.rotation.y = mouse.x * 0.05

      // Slow rotation
      particles.rotation.z = elapsedTime * 0.02
      lines.rotation.z = elapsedTime * 0.01

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      isVisible = false
      if (animationId) cancelAnimationFrame(animationId)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      container.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0" />
}
