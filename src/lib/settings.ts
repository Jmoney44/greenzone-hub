import { db } from "./db";

export const DEFAULTS = {
  selarUrl: "",
  supportEmail: "",
} as const;
export type SettingKey = keyof typeof DEFAULTS;

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await db.setting.findMany();
  const out: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) if (r.key in DEFAULTS) out[r.key] = r.value;
  return out as Record<SettingKey, string>;
}
