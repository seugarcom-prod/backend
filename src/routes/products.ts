import { Router } from "express";
import {
  createFoodController,
  deleteFoodController,
  getAllFoodsController,
  getFoodByIdController,
  updateFoodController,
} from "../controllers/ProductController.ts";
import { hasRole, isAuthenticated } from "../middlewares/index.js";

export default (productsRouter: Router) => {
  productsRouter.post(
    "/restaurant/:id/products/",
    isAuthenticated,
    hasRole("ADMIN"),
    createFoodController
  );
  productsRouter.get(
    "/restaurant/:id/products/",
    isAuthenticated,
    getAllFoodsController
  );
  productsRouter.get(
    "/restaurant/:id/products/",
    isAuthenticated,
    getFoodByIdController
  );
  productsRouter.patch(
    "/restaurant/:id/products/:id/update",
    hasRole("ADMIN"),
    isAuthenticated,
    updateFoodController
  );
  productsRouter.delete(
    "/restaurant/:id/products/:id/delete",
    hasRole("ADMIN"),
    isAuthenticated,
    deleteFoodController
  );
};
