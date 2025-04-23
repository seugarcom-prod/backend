import express from "express";
import {
  createUserController,
  getAllUsersController,
  deleteUserController,
  getUserByIdController,
  updateUserController,
  createRestaurantUserController,
} from "../controllers/UserController.ts";
import { isAuthenticated, hasRole } from "../middlewares";

export default (userRouter: express.Router) => {

  userRouter.post("/users/create", createUserController);
  userRouter.post("/users/:restaurantId/create",
    isAuthenticated,
    hasRole(['ADMIN', 'MANAGER']),
    createRestaurantUserController);
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
