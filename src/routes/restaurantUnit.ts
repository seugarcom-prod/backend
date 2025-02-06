import { Request, Response, NextFunction, Router } from "express";
import { body, validationResult } from "express-validator";
import {
  createRestaurantUnitController,
  deleteRestaurantUnitController,
  getAllRestaurantUnitsController,
  getRestaurantUnitByIdController,
  updateRestaurantUnitController,
} from "../controllers/restaurantUnitController.ts";
import { hasRole, isAuthenticated } from "../middlewares/index.ts";
import { getRestaurantUnitOrdersController } from "../controllers/OrderController.ts";

export default (restaurantUnitRouter: Router) => {
  // Cria uma nova unidade de restaurante
  restaurantUnitRouter.post(
    "/restaurants",
    isAuthenticated,
    hasRole("ADMIN"),
    createRestaurantUnitController
  );

  // Lista todas as unidades de restaurante
  restaurantUnitRouter.get("/restaurants",
    isAuthenticated,
    hasRole("ADMIN"),
    getAllRestaurantUnitsController
  );

  // Recebe os pedidos da unidade de restaurante
  restaurantUnitRouter.get("/restaurants/:id/orders",
    isAuthenticated,
    getRestaurantUnitOrdersController
  );

  // Obtém uma unidade de restaurante por ID
  restaurantUnitRouter.get("/restaurants/:id",
    isAuthenticated,
    hasRole("ADMIN"),
    getRestaurantUnitByIdController
  );

  // Atualiza uma unidade de restaurante
  restaurantUnitRouter.put(
    "/restaurants/:id",
    isAuthenticated,
    hasRole("ADMIN"),
    updateRestaurantUnitController
  );

  // Exclui uma unidade de restaurante
  restaurantUnitRouter.delete(
    "/restaurants/:id",
    isAuthenticated,
    hasRole("ADMIN"),
    deleteRestaurantUnitController
  );

};