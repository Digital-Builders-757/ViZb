/**
 * Category validation for createEvent and updateEventDetails (community + official).
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"

const PLATFORM_ORG_ID = "platform-org-id"

let mockProfile: { platform_role: string } | null = { platform_role: "staff_admin" }
let mockMembership: { role: string } | null = null
let mockEventRow: Record<string, unknown> | null = null
let lastInsertPayload: Record<string, unknown> | null = null
let lastUpdatePayload: Record<string, unknown> | null = null

const mockFrom = vi.fn().mockImplementation((table: string) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      if (table === "events") lastInsertPayload = payload
      return {
        select: vi.fn().mockReturnValue({
          single: () =>
            Promise.resolve({
              data: { id: "new-evt", slug: "test-event" },
              error: null,
            }),
        }),
      }
    }),
    update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      if (table === "events") lastUpdatePayload = payload
      return {
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
    }),
    maybeSingle: vi.fn().mockImplementation(() => {
      if (table === "profiles") {
        return Promise.resolve({ data: mockProfile, error: null })
      }
      if (table === "events") {
        return Promise.resolve({ data: null, error: null })
      }
      if (table === "organizations") {
        return Promise.resolve({
          data: { id: PLATFORM_ORG_ID },
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    }),
    single: vi.fn().mockImplementation(() => {
      if (table === "profiles") {
        return Promise.resolve({ data: mockProfile, error: null })
      }
      if (table === "organization_members") {
        return Promise.resolve({ data: mockMembership, error: null })
      }
      if (table === "events") {
        return Promise.resolve({
          data: mockEventRow,
          error: mockEventRow ? null : { message: "Not found" },
        })
      }
      if (table === "organizations") {
        return Promise.resolve({ data: { slug: "vizb" }, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    }),
  }
  return chain
})

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn().mockImplementation(() =>
    Promise.resolve({
      user: { id: "user-123" },
      supabase: { from: mockFrom },
    }),
  ),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/orgs/platform-org", () => ({
  getPlatformOrgSlug: vi.fn(() => "vizb"),
}))

let createEvent: typeof import("../event").createEvent
let updateEventDetails: typeof import("../event").updateEventDetails

function baseCreateFormData(overrides?: { community?: boolean; categories?: string[] }) {
  const fd = new FormData()
  fd.set("org_id", PLATFORM_ORG_ID)
  fd.set("title", "Test Event")
  fd.set("description", "Desc")
  fd.set("starts_at", "2026-12-01T19:00")
  fd.set("venue_name", "Venue")
  fd.set("city", "Norfolk")
  if (overrides?.community) {
    fd.set("event_kind", "community")
  }
  for (const c of overrides?.categories ?? []) {
    fd.append("categories", c)
  }
  return fd
}

function baseUpdateFormData(overrides?: { categories?: string[] }) {
  const fd = new FormData()
  fd.set("event_id", "evt-comm-1")
  fd.set("org_id", PLATFORM_ORG_ID)
  fd.set("title", "Updated")
  fd.set("starts_at", "2026-12-01T19:00")
  fd.set("venue_name", "Venue")
  fd.set("city", "Norfolk")
  for (const c of overrides?.categories ?? []) {
    fd.append("categories", c)
  }
  return fd
}

beforeAll(async () => {
  const mod = await import("../event")
  createEvent = mod.createEvent
  updateEventDetails = mod.updateEventDetails
})

describe("createEvent categories", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfile = { platform_role: "staff_admin" }
    mockMembership = null
    lastInsertPayload = null
    lastUpdatePayload = null
  })

  it("rejects community create when no categories are sent", async () => {
    const result = await createEvent(baseCreateFormData({ community: true }))
    expect(result.error).toBe("Select at least one valid category.")
    expect(lastInsertPayload).toBeNull()
  })

  it("rejects official create when no categories are sent", async () => {
    const result = await createEvent(baseCreateFormData())
    expect(result.error).toBe("Select at least one valid category.")
    expect(lastInsertPayload).toBeNull()
  })

  it("accepts community create with open_mic and party", async () => {
    const result = await createEvent(
      baseCreateFormData({ community: true, categories: ["open_mic", "party"] }),
    )
    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
    expect(lastInsertPayload?.categories).toEqual(["open_mic", "party"])
    expect(lastInsertPayload?.event_kind).toBe("community")
  })
})

describe("updateEventDetails categories", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfile = { platform_role: "staff_admin" }
    mockMembership = null
    lastUpdatePayload = null
    mockEventRow = {
      id: "evt-comm-1",
      org_id: PLATFORM_ORG_ID,
      slug: "community-event",
      status: "published",
      event_kind: "community",
    }
  })

  it("rejects community update when no categories are sent", async () => {
    const result = await updateEventDetails(baseUpdateFormData())
    expect(result.error).toBe("Select at least one valid category.")
    expect(lastUpdatePayload).toBeNull()
  })

  it("accepts community update with open_mic and party", async () => {
    const fd = baseUpdateFormData({ categories: ["open_mic", "party"] })
    fd.set("external_rsvp_url", "https://example.com/rsvp")
    const result = await updateEventDetails(fd)
    expect(result.error).toBeUndefined()
    expect(lastUpdatePayload?.categories).toEqual(["open_mic", "party"])
  })
})
