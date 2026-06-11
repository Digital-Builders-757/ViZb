/** DMV / Virginia home-region options for member preference capture. */

export const MEMBER_HOME_CITY_OPTIONS = [
  { value: "norfolk", label: "Norfolk" },
  { value: "virginia_beach", label: "Virginia Beach" },
  { value: "chesapeake", label: "Chesapeake" },
  { value: "portsmouth", label: "Portsmouth" },
  { value: "hampton", label: "Hampton" },
  { value: "newport_news", label: "Newport News" },
  { value: "richmond", label: "Richmond" },
  { value: "charlottesville", label: "Charlottesville" },
  { value: "dc_metro", label: "DC Metro" },
  { value: "other_virginia", label: "Other Virginia" },
] as const

export type MemberHomeCityValue = (typeof MEMBER_HOME_CITY_OPTIONS)[number]["value"]

const ALLOWED = new Set<string>(MEMBER_HOME_CITY_OPTIONS.map((o) => o.value))

export function isValidMemberHomeCity(v: string): v is MemberHomeCityValue {
  return ALLOWED.has(v)
}

/** Map preference slug to loose event.city substring matches for scoring. */
export function homeCityMatchTerms(slug: MemberHomeCityValue): string[] {
  switch (slug) {
    case "norfolk":
      return ["norfolk"]
    case "virginia_beach":
      return ["virginia beach", "vabeach", "va beach"]
    case "chesapeake":
      return ["chesapeake"]
    case "portsmouth":
      return ["portsmouth"]
    case "hampton":
      return ["hampton"]
    case "newport_news":
      return ["newport news", "newport"]
    case "richmond":
      return ["richmond", "rva"]
    case "charlottesville":
      return ["charlottesville", "cville"]
    case "dc_metro":
      return ["washington", "arlington", "alexandria", "fairfax", "dmv", "dc"]
    case "other_virginia":
      return ["virginia", "va"]
    default:
      return []
  }
}

export function memberHomeCityLabel(slug: string): string {
  const hit = MEMBER_HOME_CITY_OPTIONS.find((o) => o.value === slug)
  return hit?.label ?? slug.replace(/_/g, " ")
}
