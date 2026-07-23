import type { TransactionDocument } from "../models/transaction.model.js";

export function toTransactionSummary(transaction: TransactionDocument) {
  return {
    id: transaction._id.toString(),
    reference: transaction.reference,
    type: transaction.type,
    direction: transaction.direction,
    status: transaction.status,
    simulated: transaction.simulated,
    amount: transaction.amountMinor / 100,
    currency: transaction.currency,
    narration: transaction.narration,
    balanceAfter: transaction.balanceAfterMinor / 100,
    recipient: transaction.recipient,
    failureReason: transaction.failureReason,
    createdAt: transaction.createdAt,
  };
}

export type TransactionSummary = ReturnType<typeof toTransactionSummary>;
