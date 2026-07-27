import { User } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";
import { CryptoDepositRequest } from "../models/cryptoDepositRequest.model.js";
import { createNotification } from "../services/notification.service.js";

const SWEEP_INTERVAL_MS = 10_000;

let sweeping = false;

async function creditOne(requestId: string) {
  // Claim step — atomic, so two overlapping ticks (or a slow tick overlapping the next one)
  // can't both process the same request. Only one findOneAndUpdate call will still see
  // status:"accepted"; the other gets null back and skips.
  const claimed = await CryptoDepositRequest.findOneAndUpdate(
    { _id: requestId, status: "accepted" },
    { $set: { status: "crediting" } },
    { new: true },
  );
  if (!claimed) return;

  const amount = claimed.amountMinor / 100;

  const updatedUser = await User.findOneAndUpdate(
    { _id: claimed.userId },
    { $inc: { "account.balance": amount, "account.totalCredit": amount } },
    { new: true },
  );

  if (!updatedUser) {
    // User doc vanished — extremely unlikely, but leave the request stuck in "crediting"
    // rather than guessing; it'll be visibly wrong in the admin list for manual follow-up.
    console.error(`[crypto-sweeper] user ${claimed.userId.toString()} not found for request ${requestId}`);
    return;
  }

  const transaction = await Transaction.create({
    userId: claimed.userId,
    reference: claimed.reference,
    type: "crypto_deposit",
    direction: "credit",
    status: "completed",
    simulated: true,
    amountMinor: claimed.amountMinor,
    currency: claimed.currency,
    narration: `${claimed.symbol} deposit`,
    balanceAfterMinor: Math.round(updatedUser.account.balance * 100),
    crypto: {
      symbol: claimed.symbol,
      network: claimed.network,
      amountCrypto: claimed.amountCrypto,
      address: claimed.address,
      txHash: claimed.txHash,
    },
  });

  claimed.status = "credited";
  claimed.creditedAt = new Date();
  claimed.transactionId = transaction._id;
  await claimed.save();

  await createNotification({
    userId: claimed.userId,
    type: "crypto_deposit_credited",
    title: "Deposit completed",
    body: `${claimed.symbol} deposit of ${(claimed.amountMinor / 100).toFixed(2)} ${claimed.currency} has been added to your balance.`,
    link: `/dashboard/crypto-deposits/${claimed._id.toString()}`,
  });
}

async function sweep() {
  if (sweeping) return;
  sweeping = true;
  try {
    const due = await CryptoDepositRequest.find({
      status: "accepted",
      scheduledCreditAt: { $lte: new Date() },
    }).select("_id");

    for (const doc of due) {
      try {
        await creditOne(doc._id.toString());
      } catch (err) {
        console.error(`[crypto-sweeper] failed to credit request ${doc._id.toString()}:`, err);
      }
    }
  } catch (err) {
    console.error("[crypto-sweeper] sweep failed:", err);
  } finally {
    sweeping = false;
  }
}

export function startCryptoDepositCreditSweeper() {
  // Run once immediately so a cold start / restart doesn't wait a full interval to catch
  // requests that were already overdue.
  void sweep();
  setInterval(() => void sweep(), SWEEP_INTERVAL_MS);
}
