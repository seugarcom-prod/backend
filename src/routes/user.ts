import express from "express";
import {
  createUserController,
  getAllUsersController,
  deleteUserController,
  getUserByIdController,
  updateUserController,
} from "../controllers/UserController.ts";
import { isAuthenticated, hasRole } from "../middlewares";

export default (userRouter: express.Router) => {

  userRouter.post("/users/create", createUserController);
  userRouter.get("/users",
    isAuthenticated,
    hasRole('ADMIN'),
    getAllUsersController
  );
  userRouter.get("/users/:id",
    isAuthenticated,
    hasRole('ADMIN'),
    getUserByIdController
  );
  userRouter.patch("/users/edit/:id", isAuthenticated, updateUserController);
  userRouter.delete("/users/delete/:id", isAuthenticated, deleteUserController);
};
