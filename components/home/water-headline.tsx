interface WaterHeadlineProps {
  eyebrow: string
  accent: string
}

export function WaterHeadline({ eyebrow, accent }: WaterHeadlineProps) {
  const label = `${eyebrow} ${accent}`

  return (
    <>
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <filter id="home-water-ripple">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.04"
            numOctaves="2"
            seed="11"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <h1
        aria-label={label}
        className="home-water-headline mb-8 text-5xl font-black uppercase leading-[0.9] sm:text-6xl md:text-7xl lg:text-[7rem]"
      >
        <span aria-hidden="true" className="block text-[color:var(--neon-text0)]">
          {eyebrow}
        </span>
        <span aria-hidden="true" className="home-water-headline__line">
          <span className="home-water-headline__accent">{accent}</span>
          <span className="home-water-headline__refract">{accent}</span>
        </span>
      </h1>
    </>
  )
}
