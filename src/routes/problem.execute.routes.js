import { Router } from "express";
import { userAuthentication } from "../middlewares/authentication.js";
import { executeProblem } from "../controllers/problem.execute.controller.js";

const problemExecuteRoute = Router();

problemExecuteRoute.route("/execute").post(userAuthentication, executeProblem);

export default problemExecuteRoute;
