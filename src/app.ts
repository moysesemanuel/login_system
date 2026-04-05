import cors from "cors";
import express from "express";
import path from "path";

import { getAllowedOrigins, isAllowedOrigin } from "./lib/http";
import { errorHandler } from "./middlewares/error-middleware";
import { authRouter } from "./routes/auth-routes";

export const app = express();
const publicPath = path.resolve(process.cwd(), "public");

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, origin ?? getAllowedOrigins()[0]);
        return;
      }

      callback(new Error("Origem não permitida pelo CORS."));
    }
  })
);
app.use(express.json());
app.use(express.static(publicPath));

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok", service: "auth-central" });
});

app.use("/auth", authRouter);
app.use(errorHandler);

export default app;
