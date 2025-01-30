import { Router } from "express";
import { register, login, GuestLogin } from "../controllers/AuthenticationController.ts";

export default (router: Router) => {
  router.post("/auth/register", register);
  router.post("/auth/guest", GuestLogin);
  router.post("/auth/login", login);
};
