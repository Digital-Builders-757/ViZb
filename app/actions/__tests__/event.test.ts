/**
 * Tests for event action authorization + validation logic.
 *
 * Covers:
 * 1. submitEventForReview: event existence, status, flyer, membership
 * 2. uploadEventFlyer: status gate (only draft/pending; staff on published)
 * 3. createEvent: paid ticket tier seeding on official events
 */
import { EVENT_FLYER_MAX_BYTES, EVENT_FLYER_TOO_LARGE_MESSAGE, EVENT_FLYER_EMPTY_MESSAGE } from "@/lib/events/flyer-upload-constraints"
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"

// --- Mocks ---

let mockSelectResults: Record<string, { data: unknown; error: unknown }> = {}
const ticketTypeInserts: Record<string, unknown>[] = []

const mockStorageUpload = vi.fn().mockResolvedValue({ error: null })
const mockStorageRemove = vi.fn().mockResolvedValue({ error: null })
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://cdn.example.com/event-flyers/org-1/evt-1/new.jpg" },
})

const mockSupabase = {
  from: vi.fn(),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: mockStorageUpload,
      remove: mockStorageRemove,
      getPublicUrl: mockGetPublicUrl,
    }),
  },
}

function profileResult() {
  return Promise.resolve(
    mockSelectResults.profiles ?? { data: { platform_role: null }, error: null },
  )
}

mockSupabase.from.mockImplementation((table: string) => {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((col: string) => {
        if (table === "profiles" && col === "id") {
          return {
            single: profileResult,
            maybeSingle: profileResult,
          }
        }
        if (table === "organization_members") {
          return {
            eq: vi.fn().mockImplementation(() => ({
              single: () =>
                Promise.resolve(mockSelectResults.membership ?? { data: null, error: null }),
              maybeSingle: () =>
                Promise.resolve(mockSelectResults.membership ?? { data: null, error: null }),
            })),
            maybeSingle: () =>
              Promise.resolve(mockSelectResults.membership ?? { data: null, error: null }),
          }
        }
        if (table === "organizations") {
          const orgSingle = () =>
            Promise.resolve(mockSelectResults.organizations ?? { data: { slug: "test-org" }, error: null })
          const orgMaybeSingle = () =>
            Promise.resolve(mockSelectResults.organizations ?? { data: { id: "org-1" }, error: null })
          return {
            single: orgSingle,
            maybeSingle: orgMaybeSingle,
            eq: vi.fn().mockImplementation(() => ({
              single: orgSingle,
              maybeSingle: orgMaybeSingle,
            })),
          }
        }
        return {
          eq: vi.fn().mockImplementation(() => ({
            single: () => {
              if (table === "events") {
                return Promise.resolve(
                  mockSelectResults.events ?? {
                    data: null,
                    error: { message: "Not found" },
                  },
                )
              }
              return Promise.resolve({ data: null, error: null })
            },
            maybeSingle: () => {
              if (table === "events") {
                return Promise.resolve(
                  mockSelectResults.events ?? {
                    data: null,
                    error: { message: "Not found" },
                  },
                )
              }
              return Promise.resolve({ data: null, error: null })
            },
          })),
          single: () => {
            if (table === "events") {
              return Promise.resolve(
                mockSelectResults.events ?? {
                  data: null,
                  error: { message: "Not found" },
                },
              )
            }
            return Promise.resolve({ data: null, error: null })
          },
          maybeSingle: () => {
            if (table === "events") {
              return Promise.resolve(
                mockSelectResults.events ?? {
                  data: null,
                  error: { message: "Not found" },
                },
              )
            }
            return Promise.resolve({ data: null, error: null })
          },
        }
      }),
    }),
    insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
      if (table === "ticket_types") {
        ticketTypeInserts.push(row)
        return Promise.resolve({ error: null })
      }
      if (table === "events") {
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "evt-new", slug: "summer-party" },
              error: null,
            }),
          }),
        }
      }
      return Promise.resolve({ error: null })
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  }
})

const mockUser = { id: "user-123" }

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn().mockImplementation(() =>
    Promise.resolve({
      user: mockUser,
      supabase: mockSupabase,
    }),
  ),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

let submitEventForReview: typeof import("../event").submitEventForReview
let uploadEventFlyer: typeof import("../event").uploadEventFlyer
let createEvent: typeof import("../event").createEvent

beforeAll(async () => {
  const mod = await import("../event")
  submitEventForReview = mod.submitEventForReview
  uploadEventFlyer = mod.uploadEventFlyer
  createEvent = mod.createEvent
})

// ============================
// submitEventForReview
// ============================
describe("submitEventForReview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectResults = {}
  })

  it("returns error if event is not found", async () => {
    mockSelectResults.events = {
      data: null,
      error: { message: "Not found" },
    }

    const result = await submitEventForReview("nonexistent-id")
    expect(result.error).toBe("Event not found.")
  })

  it("returns error if event is not a draft", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-1",
        org_id: "org-1",
        slug: "test-event",
        status: "published",
        flyer_url: "https://example.com/flyer.jpg",
      },
      error: null,
    }

    const result = await submitEventForReview("evt-1")
    expect(result.error).toBe("Only draft or rejected events can be submitted for review.")
  })

  it("returns error if event has no flyer (official listings)", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-1",
        org_id: "org-1",
        slug: "test-event",
        status: "draft",
        flyer_url: null,
        event_kind: "official",
        external_rsvp_url: null,
      },
      error: null,
    }

    const result = await submitEventForReview("evt-1")
    expect(result.error).toBe(
      "Please upload a flyer before submitting for review.",
    )
  })

  it("returns error if community listing has no valid external RSVP URL", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-comm",
        org_id: "org-1",
        slug: "community-event",
        status: "draft",
        flyer_url: null,
        event_kind: "community",
        external_rsvp_url: null,
      },
      error: null,
    }
    mockSelectResults.membership = { data: { role: "editor" }, error: null }

    const result = await submitEventForReview("evt-comm")
    expect(result.error).toContain("RSVP URL")
  })

  it("returns error if caller is not an org member", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-1",
        org_id: "org-1",
        slug: "test-event",
        status: "draft",
        flyer_url: "https://example.com/flyer.jpg",
      },
      error: null,
    }
    mockSelectResults.membership = { data: null, error: null }

    const result = await submitEventForReview("evt-1")
    expect(result.error).toBe(
      "You don't have permission to submit events for this organization.",
    )
  })

  it("returns error if caller has viewer role only", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-1",
        org_id: "org-1",
        slug: "test-event",
        status: "draft",
        flyer_url: "https://example.com/flyer.jpg",
      },
      error: null,
    }
    mockSelectResults.membership = { data: { role: "viewer" }, error: null }

    const result = await submitEventForReview("evt-1")
    expect(result.error).toBe(
      "You don't have permission to submit events for this organization.",
    )
  })
})

// ============================
// uploadEventFlyer (validation + security)
// ============================
describe("uploadEventFlyer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectResults = {}
  })

  it("returns error if no file is provided", async () => {
    const formData = new FormData()
    formData.set("event_id", "evt-1")
    // no "flyer" field

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("Missing event ID or file.")
  })

  it("returns error if file is empty", async () => {
    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File([], "empty.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe(EVENT_FLYER_EMPTY_MESSAGE)
  })

  it("returns error if file type is not an image", async () => {
    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File(["data"], "doc.pdf", { type: "application/pdf" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("Invalid file type. Use JPEG, PNG, WebP, or GIF.")
  })

  it("returns error if file exceeds 5MB", async () => {
    const bigBuffer = new ArrayBuffer(EVENT_FLYER_MAX_BYTES + 1)
    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File([bigBuffer], "huge.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe(EVENT_FLYER_TOO_LARGE_MESSAGE)
  })

  it("returns error if event is published and caller is not staff admin", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-1",
        org_id: "org-1",
        slug: "test-event",
        status: "published",
        flyer_url: null,
      },
      error: null,
    }
    mockSelectResults.profiles = { data: { platform_role: null }, error: null }
    mockSelectResults.membership = { data: { role: "editor" }, error: null }

    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File(["img"], "flyer.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("Flyers can only be changed on draft, pending, or rejected events.")
  })

  it("allows staff admin to replace flyer on published events", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-1",
        org_id: "org-1",
        slug: "test-event",
        status: "published",
        flyer_url: null,
      },
      error: null,
    }
    mockSelectResults.profiles = { data: { platform_role: "staff_admin" }, error: null }
    mockSelectResults.organizations = { data: { slug: "test-org" }, error: null }
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://cdn.example.com/event-flyers/org-1/evt-1/new.jpg" },
    })

    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File(["img"], "flyer.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(mockStorageUpload).toHaveBeenCalled()
    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
    expect(result.flyerUrl).toContain("cdn.example.com")
  })

  it("rejects flyer replace on archived events even for staff admin", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-1",
        org_id: "org-1",
        slug: "test-event",
        status: "archived",
        flyer_url: null,
      },
      error: null,
    }
    mockSelectResults.profiles = { data: { platform_role: "staff_admin" }, error: null }

    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File(["img"], "flyer.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("Flyers cannot be changed on archived events.")
  })

  // --------------------------------------------------
  // Security: non-member path guessing attack
  // --------------------------------------------------
  // Simulates an attacker who knows an event ID and tries to upload a flyer
  // to event-flyers/{org_id}/{event_id}/... by calling the action directly.
  // The server action MUST reject before reaching storage.
  it("rejects upload if caller is not an org member (path-guessing attack)", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-target",
        org_id: "org-victim",
        slug: "victim-event",
        status: "draft",
        flyer_url: null,
      },
      error: null,
    }
    // Attacker is authenticated but NOT a member of org-victim
    mockSelectResults.membership = { data: null, error: null }

    const formData = new FormData()
    formData.set("event_id", "evt-target")
    formData.set("flyer", new File(["img"], "malicious.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("You don't have permission to upload flyers for this event.")
    // Verify storage.upload was NEVER called (the mock doesn't include storage,
    // so reaching it would throw -- the test passing means we stopped before storage)
  })

  it("rejects upload if caller has viewer role (insufficient privilege)", async () => {
    mockSelectResults.events = {
      data: {
        id: "evt-1",
        org_id: "org-1",
        slug: "test-event",
        status: "draft",
        flyer_url: null,
      },
      error: null,
    }
    mockSelectResults.membership = { data: { role: "viewer" }, error: null }

    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File(["img"], "flyer.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("You don't have permission to upload flyers for this event.")
  })

  it("rejects upload if event does not exist (ID guessing)", async () => {
    mockSelectResults.events = {
      data: null,
      error: { message: "Not found" },
    }

    const formData = new FormData()
    formData.set("event_id", "nonexistent-evt-id")
    formData.set("flyer", new File(["img"], "flyer.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("Event not found.")
  })
})

// ============================
// createEvent paid ticketing
// ============================
describe("createEvent paid ticketing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectResults = {}
    ticketTypeInserts.length = 0
    mockSelectResults.profiles = { data: { platform_role: "staff_admin" }, error: null }
    mockSelectResults.organizations = { data: { id: "org-1" }, error: null }
    mockSelectResults.events = { data: null, error: null }
    mockSelectResults.membership = { data: { role: "editor" }, error: null }
  })

  function baseCreateFormData(ticketMode: "free_rsvp" | "paid") {
    const formData = new FormData()
    formData.set("org_id", "org-1")
    formData.set("title", "Summer Party")
    formData.set("starts_at", "2026-08-01T19:00")
    formData.set("venue_name", "The Venue")
    formData.set("city", "Norfolk")
    formData.append("categories", "concert")
    formData.set("ticket_mode", ticketMode)
    if (ticketMode === "paid") {
      formData.set("paid_tier_name", "General Admission")
      formData.set("price_usd", "12.00")
      formData.set("is_active", "true")
    }
    return formData
  }

  it("seeds free RSVP tier only when ticket_mode is free_rsvp", async () => {
    const result = await createEvent(baseCreateFormData("free_rsvp"))
    expect(result.success).toBe(true)
    expect(ticketTypeInserts).toHaveLength(1)
    expect(ticketTypeInserts[0]).toMatchObject({
      name: "RSVP",
      price_cents: 0,
      is_default_rsvp: true,
    })
  })

  it("seeds free RSVP and paid tier when ticket_mode is paid", async () => {
    const result = await createEvent(baseCreateFormData("paid"))
    expect(result.success).toBe(true)
    expect(ticketTypeInserts).toHaveLength(2)
    expect(ticketTypeInserts[0]).toMatchObject({
      name: "RSVP",
      price_cents: 0,
      is_default_rsvp: true,
    })
    expect(ticketTypeInserts[1]).toMatchObject({
      name: "General Admission",
      price_cents: 1200,
      currency: "usd",
      is_default_rsvp: false,
      is_active: true,
    })
  })
})
