import { Router } from "express";
import {
  getAllRestaurantsController,
  getRestaurantByIdController,
  updateRestaurantController,
  deleteRestaurantController,
  registerRestaurantHandler,
  loginRestaurantHandler,
  getRestaurantBySlugController,
} from "../controllers/RestaurantController";
import { isAuthenticated, isRestaurantAdmin } from "../middlewares";

export default (router: Router) => {
  // Rotas públicas
  router.get("/restaurant", getAllRestaurantsController);
  router.get("/restaurant/:id", getRestaurantByIdController);
  router.get("/restaurant/by-slug/:slug", getRestaurantBySlugController);

  // Autenticação de restaurante
  router.post("/restaurant/register", registerRestaurantHandler);
  router.post("/restaurant/login", loginRestaurantHandler);

  // Rotas protegidas (requerem autenticação de restaurante)
  router.patch(
    "/restaurant/:id",
    isAuthenticated,
    isRestaurantAdmin,
    updateRestaurantController
  );

  router.delete(
    "/restaurant/:id",
    isAuthenticated,
    isRestaurantAdmin,
    deleteRestaurantController
  );

  return router;
};