import { Router } from "express";

import { applications, login, logout, profile, register } from "../controllers/auth-controller";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(register));
authRouter.post("/login", asyncHandler(login));
authRouter.post("/logout", asyncHandler(logout));
authRouter.get("/applications", asyncHandler(applications));
authRouter.get("/me", ensureAuthenticated, asyncHandler(profile));
