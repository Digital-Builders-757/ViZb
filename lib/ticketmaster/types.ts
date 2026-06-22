export type TicketmasterImage = {
  ratio?: string
  url?: string
  width?: number
  height?: number
}

export type TicketmasterVenue = {
  name?: string
  city?: { name?: string }
  state?: { stateCode?: string; name?: string }
  country?: { countryCode?: string; name?: string }
  address?: { line1?: string; line2?: string }
  postalCode?: string
  location?: { latitude?: string; longitude?: string }
}

export type TicketmasterClassification = {
  primary?: boolean
  segment?: { name?: string }
  genre?: { name?: string }
  subGenre?: { name?: string }
  type?: { name?: string }
  subType?: { name?: string }
}

export type TicketmasterPromoter = {
  id?: string
  name?: string
  description?: string
}

export type TicketmasterAttraction = {
  id?: string
  name?: string
  type?: string
}

export type TicketmasterSalesPublic = {
  startDateTime?: string
  endDateTime?: string
  startTBD?: boolean
  startTBA?: boolean
  endTBD?: boolean
}

export type TicketmasterSales = {
  public?: TicketmasterSalesPublic
  presales?: Array<{ name?: string; startDateTime?: string; endDateTime?: string }>
}

export type TicketmasterDateBlock = {
  localDate?: string
  localTime?: string
  dateTime?: string
  dateTBD?: boolean
  dateTBA?: boolean
  timeTBA?: boolean
  noSpecificTime?: boolean
}

export type TicketmasterEventDates = {
  start?: TicketmasterDateBlock
  end?: TicketmasterDateBlock
  timezone?: string
  status?: { code?: string }
  access?: { startDateTime?: string; endDateTime?: string }
  spanMultipleDays?: boolean
}

export type TicketmasterEvent = {
  id: string
  name?: string
  url?: string
  info?: string
  pleaseNote?: string
  dates?: TicketmasterEventDates
  images?: TicketmasterImage[]
  classifications?: TicketmasterClassification[]
  promoter?: TicketmasterPromoter
  _embedded?: {
    venues?: TicketmasterVenue[]
    attractions?: TicketmasterAttraction[]
  }
  sales?: TicketmasterSales
  accessibility?: { info?: string; ticketLimit?: number }
  ageRestrictions?: { legalAgeEnforced?: boolean }
}

export type TicketmasterEventsPage = {
  page?: {
    size?: number
    totalElements?: number
    totalPages?: number
    number?: number
  }
  _embedded?: {
    events?: TicketmasterEvent[]
  }
}

export type TicketmasterCitySearchResult = {
  cityKey: string
  cityQuery: string
  events: TicketmasterEvent[]
  pagesFetched: number
  errors: string[]
}

export type TicketmasterFetchSummary = {
  cities: TicketmasterCitySearchResult[]
  totalEvents: number
  errors: string[]
}

export type TicketmasterFetchOptions = {
  rangeStartIso: string
  rangeEndIso: string
  onProgress?: (info: { cityKey: string; pageNumber: number; eventsInPage: number }) => void
}
