/**
 * Fixed, static starfield layer. Render once per page shell; place siblings in a
 * `relative z-10` wrapper so content stacks above. No animation (a11y / perf).
 */
export function StarfieldBackground() {
  return (
    <div
      className="vibe-starfield"
      aria-hidden
    />
  )
}
