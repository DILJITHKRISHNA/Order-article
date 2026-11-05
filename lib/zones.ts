export const ZONES = [
  { id: "kerala", label: "Kerala" },
  { id: "tamil-nadu", label: "Tamil Nadu" },
] as const;

export type Zone = (typeof ZONES)[number]["id"];

export const DEFAULT_ZONE: Zone = "kerala";

export function isZone(value: unknown): value is Zone {
  return ZONES.some((zone) => zone.id === value);
}

export function getZoneLabel(zone: Zone): string {
  return ZONES.find((item) => item.id === zone)?.label ?? zone;
}
