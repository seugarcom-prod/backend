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
  restaurantRouter.post("/restaurant/create", createRestaurantController);
  restaurantRouter.get("/restaurant/list",
    isAuthenticated,
    hasRole("ADMIN"),
    getAllRestaurantsController
  );
  restaurantRouter.get("/restaurant/:id",
    isAuthenticated,
    hasRole("ADMIN"),
    getRestaurantByIdController
  );
  restaurantRouter.post("/restaurant/update/:id",
    isAuthenticated,
    hasRole("ADMIN"),
    updateRestaurantController
  );
  restaurantRouter.delete("/restaurant/delete/:id",
    isAuthenticated,
    hasRole("ADMIN"),
    deleteRestaurantController
  );
};
