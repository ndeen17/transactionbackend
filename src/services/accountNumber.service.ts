import { randomInt } from "node:crypto";
import { User } from "../models/user.model.js";

function randomDigits(length: number): string {
  let digits = "";
  for (let i = 0; i < length; i++) {
    digits += randomInt(0, 10).toString();
  }
  return digits;
}

export async function generateUniqueAccountNumber(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = randomDigits(10);
    const taken = await User.exists({ "account.accountNumber": candidate });
    if (!taken) return candidate;
  }

  // Effectively unreachable at any realistic account volume, but keep a widened fallback
  // consistent with how login ID generation handles the same theoretical collision case.
  return randomDigits(14);
}
