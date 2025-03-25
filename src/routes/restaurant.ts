import { Router } from "express";
import {
  createRestaurantController,
  deleteRestaurantController,
  getAllRestaurantsController,
  getRestaurantByIdController,
  getRestaurantBySlugController,
  updateRestaurantController,
} from "../controllers/RestaurantController.ts";
import { isAuthenticated, hasRole } from "../middlewares/index.ts";

export default (restaurantRouter: Router) => {
  // Criar um novo restaurante
  restaurantRouter.post(
    "/restaurant",
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

  restaurantRouter.get('/restaurant/by-slug/:slug', getRestaurantBySlugController);

  // Atualizar um restaurante
  restaurantRouter.put(
    "/restaurant/:id",
    // isAuthenticated,
    // hasRole("ADMIN"),
    updateRestaurantController
  );

  // Excluir um restaurante
  restaurantRouter.delete(
    "/restaurant/:id",
    // isAuthenticated,
    // hasRole("ADMIN"),
    deleteRestaurantController
  );
};