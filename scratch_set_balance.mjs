import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const userId = process.argv[2];
const balance = Number(process.argv[3]);

await mongoose.connect(process.env.MONGODB_URI);
const result = await mongoose.connection.collection("users").updateOne(
  { _id: new mongoose.Types.ObjectId(userId) },
  { $set: { "account.balance": balance } },
);
console.log("matched:", result.matchedCount, "modified:", result.modifiedCount);
await mongoose.disconnect();
