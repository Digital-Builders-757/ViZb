/**
 * Tests for event action authorization + validation logic.
 *
 * Covers:
 * 1. submitEventForReview: event existence, status, flyer, membership
 * 2. uploadEventFlyer: status gate (only draft/pending)
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"

// --- Mocks ---

let mockSelectResults: Record<string, { data: unknown; error: unknown }> = {}

const mockFrom = vi.fn().mockImplementation((table: string) => {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation(() => ({
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
            if (table === "organization_members") {
              return Promise.resolve(
                mockSelectResults.membership ?? { data: null, error: null },
              )
            }
            if (table === "organizations") {
              return Promise.resolve({
                data: { slug: "test-org" },
                error: null,
              })
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
      })),
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
      supabase: { from: mockFrom },
    }),
  ),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

let submitEventForReview: typeof import("../event").submitEventForReview
let uploadEventFlyer: typeof import("../event").uploadEventFlyer

beforeAll(async () => {
  const mod = await import("../event")
  submitEventForReview = mod.submitEventForReview
  uploadEventFlyer = mod.uploadEventFlyer
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

  it("returns error if event has no flyer", async () => {
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

    const result = await submitEventForReview("evt-1")
    expect(result.error).toBe(
      "Please upload a flyer before submitting for review.",
    )
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

  it("returns error if file type is not an image", async () => {
    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File(["data"], "doc.pdf", { type: "application/pdf" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("Invalid file type. Use JPEG, PNG, WebP, or GIF.")
  })

  it("returns error if file exceeds 5MB", async () => {
    const bigBuffer = new ArrayBuffer(6 * 1024 * 1024)
    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File([bigBuffer], "huge.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("File too large. Maximum size is 5MB.")
  })

  it("returns error if event is already published", async () => {
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

    const formData = new FormData()
    formData.set("event_id", "evt-1")
    formData.set("flyer", new File(["img"], "flyer.jpg", { type: "image/jpeg" }))

    const result = await uploadEventFlyer(formData)
    expect(result.error).toBe("Flyers can only be changed on draft, pending, or rejected events.")
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
