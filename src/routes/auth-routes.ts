import { Router } from "express";

import { login, profile, register } from "../controllers/auth-controller";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(register));
authRouter.post("/login", asyncHandler(login));
authRouter.get("/me", ensureAuthenticated, asyncHandler(profile));
