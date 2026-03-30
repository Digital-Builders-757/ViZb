/**
 * Optional fixed layers for /(dashboard) routes: aurora wash + static noise.
 * Global `StarfieldBackground` in root layout stays the base; this adds depth.
 */
export function NeonDashboardBackdrop() {
  return (
    <>
      <div className="neon-dashboard-aurora pointer-events-none fixed inset-0 z-[1]" aria-hidden />
      <div className="neon-dashboard-noise pointer-events-none fixed inset-0 z-[1]" aria-hidden />
    </>
  )
}
