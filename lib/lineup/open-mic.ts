/** True when the event's category tags include open mic (lineup feature applies). */

export function eventHasOpenMicCategory(categories: string[]): boolean {
  return categories.some((c) => c.toLowerCase() === "open_mic")
}
