import express from "express";
import {
createRestaurantUnitController,
deleteRestaurantUnitController,
getAllRestaurantUnitsController,
getRestaurantUnitByIdController,
updateRestaurantUnitController
} from "../controllers/restaurantUnitController.ts";
import { isAdmin, isAuthenticated } from "../middlewares/index.ts";

export default (restaurantUnitRouter: express.Router) => {
  restaurantUnitRouter.post("/restaurant/create", createRestaurantUnitController);
  restaurantUnitRouter.get("/restaurant/list", getAllRestaurantUnitsController);
  restaurantUnitRouter.get("/restaurant/:id", getRestaurantUnitByIdController);
  restaurantUnitRouter.post("/restaurant/update/:id", updateRestaurantUnitController);
  restaurantUnitRouter.delete("/restaurant/delete/:id", deleteRestaurantUnitController);
};
