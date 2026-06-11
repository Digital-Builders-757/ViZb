import { describe, expect, it } from "vitest"
import {
  hasMeaningfulMemberPreferences,
  mapMemberPreferencesRow,
  needsMemberPreferenceOnboarding,
  parseMemberCategoriesFromForm,
  parseMemberHomeCitiesFromForm,
} from "@/lib/member/preferences"

describe("member preferences", () => {
  it("requires city and category for meaningful onboarding", () => {
    const empty = mapMemberPreferencesRow(null)
    expect(hasMeaningfulMemberPreferences(empty)).toBe(false)

    const partial = mapMemberPreferencesRow({
      user_id: "u1",
      home_cities: ["norfolk"],
      categories: [],
      reminder_opt_in: true,
      email_reminders: true,
      in_app_reminders: true,
      onboarding_completed_at: null,
      vibe_tags: [],
    })
    expect(hasMeaningfulMemberPreferences(partial)).toBe(false)

    const complete = mapMemberPreferencesRow({
      user_id: "u1",
      home_cities: ["norfolk"],
      categories: ["party"],
      reminder_opt_in: true,
      email_reminders: true,
      in_app_reminders: true,
      onboarding_completed_at: "2026-06-11T12:00:00.000Z",
      vibe_tags: [],
    })
    expect(hasMeaningfulMemberPreferences(complete)).toBe(true)
    expect(needsMemberPreferenceOnboarding(complete)).toBe(false)
  })

  it("parses form selections", () => {
    const fd = new FormData()
    fd.append("homeCities", "norfolk")
    fd.append("homeCities", "richmond")
    fd.append("categories", "party")
    fd.append("categories", "open_mic")

    expect(parseMemberHomeCitiesFromForm(fd)).toEqual(["norfolk", "richmond"])
    expect(parseMemberCategoriesFromForm(fd)).toEqual(["party", "open_mic"])
  })

  it("rejects invalid form values", () => {
    const fd = new FormData()
    fd.append("homeCities", "atlanta")
    expect(parseMemberHomeCitiesFromForm(fd)).toBeNull()

    const fd2 = new FormData()
    fd2.append("categories", "not-a-category")
    expect(parseMemberCategoriesFromForm(fd2)).toBeNull()
  })
})
