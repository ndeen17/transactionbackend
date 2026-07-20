import { Router } from "express";
import { signupRouter } from "./signup.routes.js";
import { authRouter } from "./auth.routes.js";

export const apiRouter = Router();

apiRouter.use("/signup", signupRouter);
apiRouter.use("/auth", authRouter);
