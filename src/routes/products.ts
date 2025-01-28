import express from "express";
import {
  createFoodController,
  deleteFoodController,
  getAllFoodsController,
  getFoodByIdController,
  updateFoodController,
} from "../controllers/ProductController.ts";
import { isAdmin, isAuthenticated } from "../middlewares/index.js";

export default (foodsRouter: express.Router) => {
  foodsRouter.post(
    "/restaurant/:id/products/",
    isAuthenticated,
    isAdmin,
    createFoodController
  );
  foodsRouter.get(
    "/restaurant/:id/products/",
    isAuthenticated,
    getAllFoodsController
  );
  foodsRouter.get(
    "/restaurant/:id/products/",
    isAuthenticated,
    getFoodByIdController
  );
  foodsRouter.patch(
    "/restaurant/:id/products/:id/update",
    isAdmin,
    isAuthenticated,
    updateFoodController
  );
  foodsRouter.delete(
    "/restaurant/:id/products/:id/delete",
    isAdmin,
    isAuthenticated,
    deleteFoodController
  );
};
