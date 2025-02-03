import { Router } from "express";
import { register, login, guestLogin } from "../controllers/AuthenticationController.ts";

export default (router: Router) => {
  router.post("/register", register);
  router.post("/guest", guestLogin);
  router.post("/login", login);
};
