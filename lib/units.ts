export const F: Record<string, number> = { kg: 1, g: 0.001, l: 1, ml: 0.001, pcs: 1, dozen: 12, packet: 1, box: 1 };
export const GROUP: Record<string, string[]> = { kg: ["kg", "g"], g: ["kg", "g"], l: ["l", "ml"], ml: ["l", "ml"], pcs: ["pcs", "dozen"], dozen: ["pcs", "dozen"], packet: ["packet"], box: ["box"] };
export const BASE_UNITS = Object.keys(GROUP);
