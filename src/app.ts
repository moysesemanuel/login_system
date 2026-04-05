import cors from "cors";
import express from "express";
import path from "path";

import { errorHandler } from "./middlewares/error-middleware";
import { authRouter } from "./routes/auth-routes";

export const app = express();
const publicPath = path.resolve(process.cwd(), "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use(errorHandler);
