import { Router } from "express";
import { signupRouter } from "./signup.routes.js";
import { authRouter } from "./auth.routes.js";
import { pinRouter } from "./pin.routes.js";
import { transactionRouter } from "./transaction.routes.js";
import { adminRouter } from "./admin.routes.js";
import { accountRouter } from "./account.routes.js";
import { cryptoRouter } from "./crypto.routes.js";
import { notificationRouter } from "./notification.routes.js";

export const apiRouter = Router();

apiRouter.use("/signup", signupRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/pin", pinRouter);
apiRouter.use("/transactions", transactionRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/account", accountRouter);
apiRouter.use("/crypto", cryptoRouter);
apiRouter.use("/notifications", notificationRouter);
