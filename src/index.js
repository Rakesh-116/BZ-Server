import connection from "./database/connect.db.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

import authUserRoute from "./routes/profile.user.routes.js";
import problemExecuteRoute from "./routes/problem.execute.routes.js";

app.use("/api/auth", authUserRoute);
app.use("/api/problem", problemExecuteRoute);

connection();

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`App is listening at the ${port}`);
});
