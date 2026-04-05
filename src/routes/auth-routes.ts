import { Router } from "express";

import {
  applications,
  authorize,
  exchange,
  login,
  logout,
  profile,
  register
} from "../controllers/auth-controller";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(register));
authRouter.post("/login", asyncHandler(login));
authRouter.post("/logout", asyncHandler(logout));
authRouter.post("/exchange", asyncHandler(exchange));
authRouter.get("/authorize", asyncHandler(authorize));
authRouter.get("/applications", asyncHandler(applications));
authRouter.get("/me", ensureAuthenticated, asyncHandler(profile));
