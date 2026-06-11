/** Short, human-readable ticket code fragment for door staff confirmation. */
export function formatRegistrationTicketFragment(registrationId: string): string {
  const compact = registrationId.replace(/-/g, "").slice(-8).toUpperCase()
  return compact.length >= 6 ? compact : registrationId.slice(0, 8).toUpperCase()
}
