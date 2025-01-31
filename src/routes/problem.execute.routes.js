import { Router } from "express";
import { userAuthentication } from "../middlewares/authentication.js";
import { executeProblemController } from "../controllers/problem.execute.controller.js";
import { createProblemController } from "../controllers/problem.controller.js";
import { getAllProblemsController } from "../controllers/problem.controller.js";
import { getProblemDetailsController } from "../controllers/problem.controller.js";

const problemExecuteRoute = Router();

problemExecuteRoute
  .route("/execute")
  .post(userAuthentication, executeProblemController);

problemExecuteRoute
  .route("/create")
  .post(userAuthentication, createProblemController);

problemExecuteRoute
  .route("/get-all")
  .get(userAuthentication, getAllProblemsController);

problemExecuteRoute
  .route("/get/:id")
  .get(userAuthentication, getProblemDetailsController);

export default problemExecuteRoute;
