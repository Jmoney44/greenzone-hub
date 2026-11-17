import { must, supabase } from "./supabase";

export const DEFAULTS = { selarUrl: "", supportEmail: "" };
export type SettingKey = keyof typeof DEFAULTS;
export const KEYS: Record<SettingKey, string> = { selarUrl: "selar_url", supportEmail: "support_email" };

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = must(await supabase.from("settings").select("key,value")) as { key: string; value: string }[];
  const out = { ...DEFAULTS };
  for (const [k, col] of Object.entries(KEYS) as [SettingKey, string][]) {
    const row = rows.find((r) => r.key === col);
    if (row) out[k] = row.value;
  }
  return out;
}
