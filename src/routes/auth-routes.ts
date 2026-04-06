import { Router } from "express";

import {
  applications,
  adminUsers,
  authorize,
  exchange,
  forgotPassword,
  login,
  logout,
  profile,
  resetPasswordAction,
  register
} from "../controllers/auth-controller";
import { ensureAdmin, ensureAuthenticated } from "../middlewares/auth-middleware";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(register));
authRouter.post("/login", asyncHandler(login));
authRouter.post("/logout", asyncHandler(logout));
authRouter.post("/forgot-password", asyncHandler(forgotPassword));
authRouter.post("/reset-password", asyncHandler(resetPasswordAction));
authRouter.post("/exchange", asyncHandler(exchange));
authRouter.get("/authorize", asyncHandler(authorize));
authRouter.get("/applications", asyncHandler(applications));
authRouter.get("/me", ensureAuthenticated, asyncHandler(profile));
authRouter.get("/admin/users", ensureAuthenticated, ensureAdmin, asyncHandler(adminUsers));
