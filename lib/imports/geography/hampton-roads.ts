import type { DiscoveryCity, LaunchMarket } from "@/lib/imports/geography/types"

export const HAMPTON_ROADS_MARKET_KEY = "hampton_roads" as const

export const LAUNCH_MARKET_TIMEZONE = "America/New_York" as const
export const LAUNCH_STATE_CODE = "VA" as const
export const LAUNCH_COUNTRY_CODE = "US" as const

const SHARED_DEFAULTS = {
  stateCode: LAUNCH_STATE_CODE,
  countryCode: LAUNCH_COUNTRY_CODE,
  timezone: LAUNCH_MARKET_TIMEZONE,
} as const

/** Hampton Roads launch cities — single source of truth for discovery geography (#268). */
export const HAMPTON_ROADS_CITIES: DiscoveryCity[] = [
  {
    key: "norfolk",
    displayName: "Norfolk",
    cityQuery: "Norfolk",
    ...SHARED_DEFAULTS,
    postalCodes: ["23501", "23502", "23503", "23504", "23505", "23507", "23508", "23509", "23510", "23511", "23513", "23517", "23518", "23523", "23551"],
    coordinates: { latitude: 36.8508, longitude: -76.2859 },
  },
  {
    key: "virginia_beach",
    displayName: "Virginia Beach",
    cityQuery: "Virginia Beach",
    ...SHARED_DEFAULTS,
    postalCodes: ["23450", "23451", "23452", "23453", "23454", "23455", "23456", "23457", "23459", "23460", "23461", "23462", "23463", "23464", "23465", "23466", "23467", "23471"],
    coordinates: { latitude: 36.8529, longitude: -75.978 },
  },
  {
    key: "chesapeake",
    displayName: "Chesapeake",
    cityQuery: "Chesapeake",
    ...SHARED_DEFAULTS,
    postalCodes: ["23320", "23321", "23322", "23323", "23324", "23325"],
    coordinates: { latitude: 36.7682, longitude: -76.2875 },
  },
  {
    key: "portsmouth",
    displayName: "Portsmouth",
    cityQuery: "Portsmouth",
    ...SHARED_DEFAULTS,
    postalCodes: ["23701", "23702", "23703", "23704", "23707", "23708", "23709"],
    coordinates: { latitude: 36.8354, longitude: -76.2983 },
  },
  {
    key: "hampton",
    displayName: "Hampton",
    cityQuery: "Hampton",
    ...SHARED_DEFAULTS,
    postalCodes: ["23630", "23631", "23661", "23663", "23664", "23665", "23666", "23667", "23668", "23669", "23670", "23681"],
    coordinates: { latitude: 37.0299, longitude: -76.3452 },
  },
  {
    key: "newport_news",
    displayName: "Newport News",
    cityQuery: "Newport News",
    ...SHARED_DEFAULTS,
    postalCodes: ["23601", "23602", "23603", "23604", "23605", "23606", "23607", "23608", "23612"],
    coordinates: { latitude: 37.0871, longitude: -76.473 },
  },
  {
    key: "suffolk",
    displayName: "Suffolk",
    cityQuery: "Suffolk",
    ...SHARED_DEFAULTS,
    postalCodes: ["23432", "23433", "23434", "23435", "23436", "23437", "23438", "23439"],
    coordinates: { latitude: 36.7282, longitude: -76.5836 },
  },
  {
    key: "williamsburg",
    displayName: "Williamsburg",
    cityQuery: "Williamsburg",
    ...SHARED_DEFAULTS,
    postalCodes: ["23185", "23186", "23188"],
    coordinates: { latitude: 37.2707, longitude: -76.7075 },
  },
]

function assertUniqueCityKeys(cities: DiscoveryCity[]): void {
  const keys = new Set<string>()
  for (const city of cities) {
    if (keys.has(city.key)) {
      throw new Error(`Duplicate discovery city key: ${city.key}`)
    }
    keys.add(city.key)
  }
}

assertUniqueCityKeys(HAMPTON_ROADS_CITIES)

export const HAMPTON_ROADS_LAUNCH_MARKET: LaunchMarket = {
  key: HAMPTON_ROADS_MARKET_KEY,
  displayName: "Hampton Roads",
  stateCode: LAUNCH_STATE_CODE,
  countryCode: LAUNCH_COUNTRY_CODE,
  timezone: LAUNCH_MARKET_TIMEZONE,
  cities: HAMPTON_ROADS_CITIES,
}
