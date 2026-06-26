import { describe, expect, it } from "vitest"
import { mapTicketmasterCategories } from "@/lib/ticketmaster/category-map"
import type { TicketmasterEvent } from "@/lib/ticketmaster/types"

function event(input: Partial<TicketmasterEvent>): TicketmasterEvent {
  return { id: input.id ?? "tm-test", ...input }
}

describe("mapTicketmasterCategories", () => {
  it("maps Ticketmaster Music events to music and concert", () => {
    expect(
      mapTicketmasterCategories(
        event({
          name: "Bryson Tiller Presents: The Neo Trapsoul Tour",
          classifications: [
            {
              primary: true,
              segment: { name: "Music" },
              genre: { name: "R&B" },
              subGenre: { name: "Soul" },
            },
          ],
        }),
      ),
    ).toEqual(["music", "concert"])
  })

  it("keeps music open mics out of the concert bucket", () => {
    expect(
      mapTicketmasterCategories(
        event({
          name: "757 Open Mic Night",
          classifications: [{ segment: { name: "Music" } }],
        }),
      ),
    ).toEqual(["music", "open_mic"])
  })

  it("tags music parties as party and music", () => {
    expect(
      mapTicketmasterCategories(
        event({
          name: "R&B Rooftop Day Party",
          classifications: [{ segment: { name: "Music" }, genre: { name: "R&B" } }],
        }),
      ),
    ).toEqual(["party", "music"])
  })

  it("tags music workshops without calling them concerts", () => {
    expect(
      mapTicketmasterCategories(
        event({
          name: "Songwriting Workshop",
          classifications: [{ segment: { name: "Music" } }],
        }),
      ),
    ).toEqual(["workshop", "music"])
  })

  it("maps family events to social", () => {
    expect(
      mapTicketmasterCategories(
        event({
          name: "Family Fun Day",
          classifications: [{ segment: { name: "Family" } }],
        }),
      ),
    ).toEqual(["social"])
  })

  it("falls back to other for unsupported Ticketmaster segments", () => {
    expect(
      mapTicketmasterCategories(
        event({
          name: "Hockey Night",
          classifications: [{ segment: { name: "Sports" }, genre: { name: "Hockey" } }],
        }),
      ),
    ).toEqual(["other"])
  })
})
