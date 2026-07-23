import { randomInt } from "node:crypto";
import { Transaction } from "../models/transaction.model.js";

// No 0/O or 1/I — avoids ambiguous characters on a printed/screenshotted receipt.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomChars(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

function todayStamp(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function buildCandidate(randomLength = 6): string {
  return `AST${todayStamp()}${randomChars(randomLength)}`;
}

export async function generateUniqueReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = buildCandidate(6);
    const taken = await Transaction.exists({ reference: candidate });
    if (!taken) return candidate;
  }

  return buildCandidate(10);
}
