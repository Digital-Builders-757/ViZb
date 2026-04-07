"use client"

import { useEffect, useState, useRef, useMemo, Suspense } from "react"
import Image from "next/image"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

// Water splash particle system
function WaterSplash({ triggered }: { triggered: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)
  const [splashPhase, setSplashPhase] = useState(0)
  
  const particleCount = 200
  const { positions, velocities, sizes, lifetimes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const velocities: THREE.Vector3[] = []
    const sizes = new Float32Array(particleCount)
    const lifetimes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      // Start from center bottom
      positions[i * 3] = (Math.random() - 0.5) * 0.5
      positions[i * 3 + 1] = -2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5
      
      // Explosive upward velocity with spread
      const angle = Math.random() * Math.PI * 2
      const upForce = 0.08 + Math.random() * 0.12
      const outForce = 0.02 + Math.random() * 0.06
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * outForce,
        upForce,
        Math.sin(angle) * outForce
      ))
      
      sizes[i] = 0.03 + Math.random() * 0.08
      lifetimes[i] = Math.random()
    }
    
    return { positions, velocities, sizes, lifetimes }
  }, [])
  
  useEffect(() => {
    if (triggered) {
      setSplashPhase(1)
    }
  }, [triggered])
  
  useFrame((state, delta) => {
    if (!particlesRef.current || splashPhase === 0) return
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const gravity = -0.003
    
    for (let i = 0; i < particleCount; i++) {
      // Apply velocity
      positions[i * 3] += velocities[i].x
      positions[i * 3 + 1] += velocities[i].y
      positions[i * 3 + 2] += velocities[i].z
      
      // Apply gravity
      velocities[i].y += gravity
      
      // Damping
      velocities[i].x *= 0.99
      velocities[i].z *= 0.99
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#00d1ff"
        transparent
        opacity={splashPhase > 0 ? 0.8 : 0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// Animated water surface with ripples
function WaterSurface({ splashTriggered }: { splashTriggered: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSplash: { value: 0 },
    uColor1: { value: new THREE.Color("#00d1ff") },
    uColor2: { value: new THREE.Color("#a855f7") },
  }), [])
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      // Animate splash intensity
      if (splashTriggered) {
        materialRef.current.uniforms.uSplash.value = Math.min(
          materialRef.current.uniforms.uSplash.value + 0.05,
          1
        )
      }
    }
  })
  
  const vertexShader = `
    uniform float uTime;
    uniform float uSplash;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Base waves
      float wave1 = sin(pos.x * 3.0 + uTime * 2.0) * 0.1;
      float wave2 = sin(pos.y * 2.5 + uTime * 1.5) * 0.08;
      float wave3 = cos(pos.x * 2.0 - pos.y * 3.0 + uTime * 2.5) * 0.06;
      
      // Splash ripple from center
      float dist = length(pos.xy);
      float ripple = sin(dist * 8.0 - uTime * 6.0) * 0.2 * uSplash * (1.0 - smoothstep(0.0, 3.0, dist));
      
      pos.z = wave1 + wave2 + wave3 + ripple;
      vElevation = pos.z;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `
  
  const fragmentShader = `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      float mixStrength = (vElevation + 0.2) * 2.0;
      vec3 color = mix(uColor1, uColor2, mixStrength);
      
      // Add shimmer
      float shimmer = sin(vUv.x * 40.0 + uTime * 3.0) * sin(vUv.y * 40.0 + uTime * 2.0) * 0.1;
      color += shimmer;
      
      // Fresnel-like edge glow
      float alpha = 0.4 + vElevation * 0.5;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1.5, 0]}>
      <planeGeometry args={[10, 10, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Floating water droplets
function WaterDroplets() {
  const groupRef = useRef<THREE.Group>(null)
  const droplets = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 6,
        Math.random() * 4 - 1,
        (Math.random() - 0.5) * 3
      ] as [number, number, number],
      scale: 0.02 + Math.random() * 0.04,
      speed: 0.5 + Math.random() * 1,
      offset: Math.random() * Math.PI * 2,
    }))
  }, [])
  
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      const droplet = droplets[i]
      child.position.y = droplet.position[1] + Math.sin(state.clock.elapsedTime * droplet.speed + droplet.offset) * 0.3
      child.position.x = droplet.position[0] + Math.cos(state.clock.elapsedTime * droplet.speed * 0.5 + droplet.offset) * 0.1
    })
  })
  
  return (
    <group ref={groupRef}>
      {droplets.map((droplet, i) => (
        <mesh key={i} position={droplet.position}>
          <sphereGeometry args={[droplet.scale, 16, 16]} />
          <meshBasicMaterial
            color="#00d1ff"
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}

// Glowing ring burst effect
function RingBurst({ triggered }: { triggered: boolean }) {
  const ringsRef = useRef<THREE.Group>(null)
  const [active, setActive] = useState(false)
  
  useEffect(() => {
    if (triggered) {
      const timer = setTimeout(() => setActive(true), 500)
      return () => clearTimeout(timer)
    }
  }, [triggered])
  
  useFrame((state) => {
    if (!ringsRef.current || !active) return
    ringsRef.current.children.forEach((ring, i) => {
      const mesh = ring as THREE.Mesh
      const scale = 1 + (state.clock.elapsedTime * (0.5 + i * 0.2)) % 3
      mesh.scale.setScalar(scale)
      const material = mesh.material as THREE.MeshBasicMaterial
      material.opacity = Math.max(0, 1 - scale / 3) * 0.5
    })
  })
  
  return (
    <group ref={ringsRef} position={[0, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.85, 64]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#00d1ff" : "#a855f7"}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// Main 3D scene
function Scene({ splashTriggered }: { splashTriggered: boolean }) {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 1, 5)
    camera.lookAt(0, 0, 0)
  }, [camera])
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 2, 2]} intensity={1} color="#00d1ff" />
      <pointLight position={[-2, 1, 0]} intensity={0.5} color="#a855f7" />
      
      <WaterSurface splashTriggered={splashTriggered} />
      <WaterSplash triggered={splashTriggered} />
      <WaterDroplets />
      <RingBurst triggered={splashTriggered} />
      
      <fog attach="fog" args={["#0a0a0f", 3, 12]} />
    </>
  )
}

// Animated text component with wave effect
function AnimatedText({ 
  children, 
  className, 
  delay = 0,
  waveIntensity = "normal"
}: { 
  children: string
  className?: string
  delay?: number
  waveIntensity?: "subtle" | "normal" | "intense"
}) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  
  const intensity = {
    subtle: { y: 3, rotate: 1, duration: 2 },
    normal: { y: 6, rotate: 2, duration: 1.5 },
    intense: { y: 10, rotate: 4, duration: 1.2 }
  }[waveIntensity]
  
  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      {children.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block transition-all"
          style={{
            animationName: mounted ? "textWave" : "none",
            animationDuration: `${intensity.duration}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${i * 0.08}s`,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`,
            ["--wave-y" as string]: `${intensity.y}px`,
            ["--wave-rotate" as string]: `${intensity.rotate}deg`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  )
}

// Glitch text effect for "isn't"
function GlitchText({ children, className }: { children: string; className?: string }) {
  return (
    <span className={`glitch-text relative inline-block ${className}`} data-text={children}>
      {children}
    </span>
  )
}

export default function RootLoading() {
  const [mounted, setMounted] = useState(false)
  const [splashTriggered, setSplashTriggered] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Trigger splash after a brief moment
    const splashTimer = setTimeout(() => setSplashTriggered(true), 300)
    // Show content after splash
    const contentTimer = setTimeout(() => setShowContent(true), 800)
    
    return () => {
      clearTimeout(splashTimer)
      clearTimeout(contentTimer)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* Three.js Canvas Background */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Canvas
            dpr={[1, 2]}
            gl={{ 
              antialias: true, 
              alpha: true,
              powerPreference: "high-performance"
            }}
          >
            <Scene splashTriggered={splashTriggered} />
          </Canvas>
        </Suspense>
      </div>

      {/* Deep ocean gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 120%, rgba(0, 209, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 20% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 90%, rgba(0, 209, 255, 0.12) 0%, transparent 55%)
          `,
        }}
        aria-hidden
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        {/* Pre-header text */}
        <div
          className={`mb-6 overflow-hidden transition-all duration-700 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#00d1ff] sm:text-xs">
            <AnimatedText delay={800} waveIntensity="subtle">
              Signal Incoming
            </AnimatedText>
          </p>
        </div>

        {/* Logo with water ripple effect */}
        <div
          className={`relative transition-all duration-1000 ${
            showContent ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          {/* Ripple rings */}
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <div 
              className="absolute h-48 w-48 rounded-full border border-[#00d1ff] sm:h-64 sm:w-64 md:h-80 md:w-80"
              style={{
                animation: showContent ? "rippleExpand 2.4s ease-out infinite" : "none",
              }}
            />
            <div 
              className="absolute h-48 w-48 rounded-full border border-[#a855f7] sm:h-64 sm:w-64 md:h-80 md:w-80"
              style={{
                animation: showContent ? "rippleExpand 2.4s ease-out infinite 0.8s" : "none",
              }}
            />
            <div 
              className="absolute h-48 w-48 rounded-full border border-[#00d1ff] sm:h-64 sm:w-64 md:h-80 md:w-80"
              style={{
                animation: showContent ? "rippleExpand 2.4s ease-out infinite 1.6s" : "none",
              }}
            />
          </div>

          {/* Logo with glow */}
          <div 
            className="relative"
            style={{
              animation: showContent ? "logoFloat 3s ease-in-out infinite" : "none",
            }}
          >
            <div
              className="absolute inset-0 blur-2xl"
              style={{
                background: `radial-gradient(circle, rgba(0, 209, 255, 0.4) 0%, transparent 70%)`,
              }}
              aria-hidden
            />
            <Image
              src="/vibe-logo.png"
              alt="VIZB"
              width={280}
              height={280}
              className="relative h-36 w-36 select-none object-contain sm:h-48 sm:w-48 md:h-64 md:w-64"
              style={{
                filter: "drop-shadow(0 0 40px rgba(0, 209, 255, 0.5))",
              }}
              priority
              draggable={false}
            />
          </div>
        </div>

        {/* Main headline with animated words */}
        <h1
          className={`mt-8 text-center font-serif text-2xl font-bold tracking-tight transition-all duration-1000 sm:text-3xl md:text-4xl ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          <span className="block text-[#f0f0f5]">
            <AnimatedText delay={1200} waveIntensity="normal">Virginia</AnimatedText>
            {" "}
            <GlitchText className="text-[#00d1ff]">isn&apos;t</GlitchText>
            {" "}
            <AnimatedText delay={1400} waveIntensity="intense">boring.</AnimatedText>
          </span>
        </h1>

        {/* Animated tagline */}
        <p
          className={`mt-4 max-w-md text-center text-sm leading-relaxed transition-all duration-1000 sm:text-base ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "600ms", color: "rgba(240, 240, 245, 0.7)" }}
        >
          <AnimatedText delay={1600} waveIntensity="subtle">
            Dive into the culture wave
          </AnimatedText>
        </p>

        {/* Water loader bar */}
        <div
          className={`mt-10 transition-all duration-1000 ${
            showContent ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <div
            role="status"
            aria-live="polite"
            aria-label="Loading"
            className="water-loader relative isolate h-1.5 w-48 overflow-hidden rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] sm:h-2 sm:w-64 md:w-80"
            style={{ background: "rgba(30, 30, 40, 0.65)" }}
          >
            <div
              className="water-loader-fill pointer-events-none absolute inset-0 rounded-[inherit]"
              aria-hidden
            />
            <div
              className="water-shimmer pointer-events-none absolute inset-0 rounded-[inherit] opacity-90 mix-blend-screen"
              aria-hidden
            />
            <div
              className="water-loader-sheen pointer-events-none absolute inset-0 rounded-[inherit] opacity-50"
              aria-hidden
            />
          </div>
        </div>

        {/* Bottom tagline */}
        <p
          className={`mt-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[#00d1ff] transition-all duration-1000 ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "1000ms" }}
        >
          <AnimatedText delay={2000} waveIntensity="subtle">
            Driving culture forward
          </AnimatedText>
        </p>
      </div>

      {/* Scan line effect */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            transparent 0%,
            transparent 48%,
            rgba(0, 209, 255, 0.06) 49%,
            rgba(0, 209, 255, 0.1) 50%,
            rgba(0, 209, 255, 0.06) 51%,
            transparent 52%,
            transparent 100%
          )`,
          animation: mounted ? "scanLine 4s linear infinite" : "none",
        }}
        aria-hidden
      />

      <style jsx>{`
        @keyframes textWave {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(calc(var(--wave-y) * -1)) rotate(var(--wave-rotate));
          }
          75% {
            transform: translateY(var(--wave-y)) rotate(calc(var(--wave-rotate) * -1));
          }
        }

        @keyframes rippleExpand {
          0% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-12px) scale(1.02);
          }
        }

        @keyframes scanLine {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100vh);
          }
        }

        .glitch-text {
          animation: glitchText 3s ease-in-out infinite;
        }

        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-text::before {
          animation: glitchBefore 3s ease-in-out infinite;
          clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
          color: #ff00ff;
        }

        .glitch-text::after {
          animation: glitchAfter 3s ease-in-out infinite;
          clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
          color: #00ffff;
        }

        @keyframes glitchText {
          0%, 90%, 100% {
            transform: translateX(0) skewX(0deg);
          }
          92% {
            transform: translateX(-3px) skewX(-2deg);
          }
          94% {
            transform: translateX(3px) skewX(2deg);
          }
          96% {
            transform: translateX(-2px) skewX(-1deg);
          }
          98% {
            transform: translateX(2px) skewX(1deg);
          }
        }

        @keyframes glitchBefore {
          0%, 90%, 100% {
            transform: translateX(0);
            opacity: 0;
          }
          92%, 94% {
            transform: translateX(-4px);
            opacity: 0.8;
          }
          96%, 98% {
            transform: translateX(4px);
            opacity: 0.8;
          }
        }

        @keyframes glitchAfter {
          0%, 90%, 100% {
            transform: translateX(0);
            opacity: 0;
          }
          92%, 94% {
            transform: translateX(4px);
            opacity: 0.8;
          }
          96%, 98% {
            transform: translateX(-4px);
            opacity: 0.8;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .glitch-text,
          .glitch-text::before,
          .glitch-text::after {
            animation: none;
          }
          .glitch-text::before,
          .glitch-text::after {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
