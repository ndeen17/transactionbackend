import { randomInt } from "node:crypto";
import { User } from "../models/user.model.js";

const COMBINING_MARK_MIN = 0x0300;
const COMBINING_MARK_MAX = 0x036f;

function stripDiacritics(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < COMBINING_MARK_MIN || code > COMBINING_MARK_MAX) {
      result += char;
    }
  }
  return result;
}

function normalizeNamePart(value: string): string {
  const cleaned = stripDiacritics(value.normalize("NFD"))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return cleaned || "user";
}

export function buildBaseLoginId(firstName: string, lastName: string): string {
  const base = `${normalizeNamePart(firstName)}.${normalizeNamePart(lastName)}`;
  return base.slice(0, 20);
}

/** Best-effort suggestion. Not reserved — the real generation happens again at signup time. */
export async function suggestLoginId(firstName: string, lastName: string): Promise<string> {
  const base = buildBaseLoginId(firstName, lastName);
  return generateUniqueLoginId(base);
}

export async function generateUniqueLoginId(base: string): Promise<string> {
  const exists = await User.exists({ "auth.loginId": base });
  if (!exists) return base;

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = randomInt(1000, 9999);
    const candidate = `${base}${suffix}`;
    const taken = await User.exists({ "auth.loginId": candidate });
    if (!taken) return candidate;
  }

  const suffix = randomInt(100000, 999999);
  return `${base}${suffix}`;
}
