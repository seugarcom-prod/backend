import express from "express";
import {
  createFoodController,
  deleteFoodController,
  getAllFoodsController,
  getFoodByIdController,
  updateFoodController,
} from "../controllers/FoodController.ts";
import { isAdmin, isAuthenticated } from "../middlewares/index.js";

export default (foodsRouter: express.Router) => {
  foodsRouter.post(
    "/restaurant/products/create",
    isAuthenticated,
    isAdmin,
    createFoodController
  );
  foodsRouter.get(
    "/restaurant/products/list",
    isAuthenticated,
    getAllFoodsController
  );
  foodsRouter.get(
    "/restaurant/products/:id",
    isAuthenticated,
    getFoodByIdController
  );
  foodsRouter.patch(
    "/restaurant/products/update",
    isAdmin,
    isAuthenticated,
    updateFoodController
  );
  foodsRouter.delete(
    "/restaurant/products/delete",
    isAdmin,
    isAuthenticated,
    deleteFoodController
  );
};
