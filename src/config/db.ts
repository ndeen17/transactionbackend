import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  mongoose.connection.on("connected", () => {
    console.log("[db] connected to MongoDB");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err.message);
  });

  await mongoose.connect(env.MONGODB_URI);
}
