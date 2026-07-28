import mongoose from "mongoose";
import "dotenv/config";
const uri = process.env.MONGODB_URI;
await mongoose.connect(uri);
const db = mongoose.connection;
await db.collection("users").updateOne({ "auth.loginId": "bank.check" }, { $set: { status: "active", emailVerifiedAt: new Date() } });
console.log("activated");
await mongoose.disconnect();
