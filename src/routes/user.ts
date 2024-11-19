import express from "express";
import {
  createUserController,
  getAllUsersController,
  deleteUserController,
  getUserByIdController,
  updateUserController,
} from "../controllers/UserController.ts";
import { isAuthenticated, isAdmin } from "../middlewares";

export default (userRouter: express.Router) => {
  // userRouter.get("/users", isAuthenticated, isAdmin, getAllUsersController);
  // userRouter.post("/users/create", createUserController);
  // userRouter.get("/users/:id", isAuthenticated, isAdmin, getUserByIdController);
  // userRouter.patch("/users/:id", isAuthenticated, updateUserController);
  // userRouter.delete(
  //   "/users/:id",
  //   isAuthenticated,
  //   isAdmin,
  //   deleteUserController
  // );

  userRouter.post("/users/create", createUserController);
  userRouter.get("/users", getAllUsersController);
  userRouter.get("/users/:id", getUserByIdController);
  userRouter.patch("/users/edit/:id", updateUserController);
  userRouter.delete("/users/delete/:id", deleteUserController);
};
