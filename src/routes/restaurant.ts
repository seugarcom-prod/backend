import { Router } from "express";
import {
  createRestaurantController,
  deleteRestaurantController,
  getAllRestaurantsController,
  getRestaurantByIdController,
  updateRestaurantController,
} from "../controllers/RestaurantController.ts";
import { isAuthenticated, hasRole } from "../middlewares/index.ts";

export default (restaurantRouter: Router) => {
  // Criar um novo restaurante
  restaurantRouter.post(
    "/restaurant",
    isAuthenticated,
    hasRole("ADMIN"),
    createRestaurantController
  );

  // Obter todos os restaurantes
  restaurantRouter.get(
    "/restaurant",
    getAllRestaurantsController
  );

  // Obter um restaurante específico por ID
  restaurantRouter.get(
    "/restaurant/:id",
    getRestaurantByIdController
  );

  // Atualizar um restaurante
  restaurantRouter.put(
    "/restaurant/:id",
    isAuthenticated,
    hasRole("ADMIN"),
    updateRestaurantController
  );

  // Excluir um restaurante
  restaurantRouter.delete(
    "/restaurant/:id",
    isAuthenticated,
    hasRole("ADMIN"),
    deleteRestaurantController
  );
};