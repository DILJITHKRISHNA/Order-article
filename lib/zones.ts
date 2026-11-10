export const ZONES = [
  { id: "retail", label: "Retail" },
  { id: "chennai", label: "Chennai" },
  { id: "selam", label: "Selam" },
] as const;

export type Zone = (typeof ZONES)[number]["id"];

export const DEFAULT_ZONE: Zone = "retail";

export function isZone(value: unknown): value is Zone {
  return ZONES.some((zone) => zone.id === value);
}

export function getZoneLabel(zone: Zone): string {
  return ZONES.find((item) => item.id === zone)?.label ?? zone;
}
