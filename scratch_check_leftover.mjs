import mongoose from "mongoose";
import "dotenv/config";
const uri = process.env.MONGODB_URI;
await mongoose.connect(uri);
const db = mongoose.connection;
const docs = await db.collection("cryptodepositrequests").find({}).toArray();
console.log(JSON.stringify(docs, null, 2));
await mongoose.disconnect();
