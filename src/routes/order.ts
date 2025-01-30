import { Router } from "express";
import {
  createOrderHandler,
  deleteOrderController,
  getRestaurantUnitOrdersHandler,
  getOrderByIdController,
  updateOrderController,
} from "../controllers/OrderController.ts";
import { isAuthenticated } from "../middlewares/index.ts";

export default (orderRouter: Router) => {
  orderRouter.post(
    "/user/:id/:restaurantId/request",
    isAuthenticated,
    createOrderHandler
  );
  orderRouter.get(
    "/user/:id/request/list",
    isAuthenticated,
    getRestaurantUnitOrdersHandler
  );
  orderRouter.get(
    "/user/:id/request/:id",
    isAuthenticated,
    getOrderByIdController
  );
  orderRouter.patch(
    "/user/:id/request/:id/update",
    isAuthenticated,
    updateOrderController
  );
  orderRouter.delete(
    "/user/:id/request/:id/delete",
    isAuthenticated,
    deleteOrderController
  );
};
