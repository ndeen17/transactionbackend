import { randomInt } from "node:crypto";
import { Transaction } from "../models/transaction.model.js";
import { CryptoDepositRequest } from "../models/cryptoDepositRequest.model.js";
import { BankDepositRequest } from "../models/bankDepositRequest.model.js";
import { CryptoWithdrawalRequest } from "../models/cryptoWithdrawalRequest.model.js";
import { BankWithdrawalRequest } from "../models/bankWithdrawalRequest.model.js";

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

// Checked against every collection that carries a reference — a deposit request's reference
// is generated once at claim submission and reused verbatim on the Transaction created when
// it's credited; a withdrawal request's reference is generated once and reused on its debit
// Transaction (its refund Transaction, if any, gets its own fresh one). They all share one
// reference namespace.
async function isReferenceTaken(candidate: string): Promise<boolean> {
  const [txTaken, cryptoDepositTaken, bankDepositTaken, cryptoWithdrawalTaken, bankWithdrawalTaken] =
    await Promise.all([
      Transaction.exists({ reference: candidate }),
      CryptoDepositRequest.exists({ reference: candidate }),
      BankDepositRequest.exists({ reference: candidate }),
      CryptoWithdrawalRequest.exists({ reference: candidate }),
      BankWithdrawalRequest.exists({ reference: candidate }),
    ]);
  return Boolean(txTaken || cryptoDepositTaken || bankDepositTaken || cryptoWithdrawalTaken || bankWithdrawalTaken);
}

export async function generateUniqueReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = buildCandidate(6);
    if (!(await isReferenceTaken(candidate))) return candidate;
  }

  return buildCandidate(10);
}
