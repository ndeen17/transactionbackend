import { Router } from "express";
import { signupRouter } from "./signup.routes.js";
import { authRouter } from "./auth.routes.js";
import { pinRouter } from "./pin.routes.js";
import { transactionRouter } from "./transaction.routes.js";

export const apiRouter = Router();

apiRouter.use("/signup", signupRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/pin", pinRouter);
apiRouter.use("/transactions", transactionRouter);
