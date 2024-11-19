import express from "express";
import {
  createRestaurantController,
  deleteRestaurantController,
  getAllRestaurantsController,
  getRestaurantByIdController,
  updateRestaurantController,
} from "../controllers/RestaurantController.ts";
import { isAdmin, isAuthenticated } from "../middlewares/index.ts";

export default (restaurantRouter: express.Router) => {
  // restaurantRouter.post(
  //   "/restaurant/create",
  //   isAuthenticated,
  //   isAdmin,
  //   createRestaurantController
  // );
  // restaurantRouter.get(
  //   "/restaurants/list",
  //   isAuthenticated,
  //   isAdmin,
  //   getAllRestaurantsController
  // );
  // restaurantRouter.get(
  //   "/restaurants/:id",
  //   isAuthenticated,
  //   isAdmin,
  //   getRestaurantByIdController
  // );

  restaurantRouter.post("/restaurant/create", createRestaurantController);
  restaurantRouter.get("/restaurant/list", getAllRestaurantsController);
  restaurantRouter.get("/restaurant/:id", getRestaurantByIdController);
  restaurantRouter.post("/restaurant/update/:id", updateRestaurantController);
  restaurantRouter.delete("/restaurant/delete/:id", deleteRestaurantController);
};
