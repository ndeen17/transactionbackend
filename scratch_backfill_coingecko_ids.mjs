import mongoose from "mongoose";
import "dotenv/config";

const uri = process.env.MONGODB_URI;
await mongoose.connect(uri);
const db = mongoose.connection;

const MAP = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
};

const assets = await db.collection("cryptoassets").find({}).toArray();
for (const asset of assets) {
  const coingeckoId = MAP[asset.symbol];
  if (!coingeckoId) {
    console.log(`Skipping ${asset.symbol} — no mapping known.`);
    continue;
  }
  await db.collection("cryptoassets").updateOne({ _id: asset._id }, { $set: { coingeckoId } });
  console.log(`Backfilled ${asset.symbol} -> coingeckoId=${coingeckoId}`);
}

await mongoose.disconnect();
