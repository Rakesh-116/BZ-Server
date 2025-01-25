import { Router } from "express";
import {
  createUser,
  loginUser,
} from "../controllers/profile.user.controller.js";

const authUserRoute = Router();

authUserRoute.route("/register").post(createUser);

authUserRoute.route("/login").post(loginUser);

export default authUserRoute;
