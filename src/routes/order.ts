import express from "express";
import {
  createOrderController,
  deleteOrderController,
  getAllOrdersController,
  getOrderByClientNameController,
  getOrderByIdController,
  updateOrderController,
} from "../controllers/OrderController.ts";
import { isAuthenticated } from "../middlewares/index.ts";

export default (orderRouter: express.Router) => {
  orderRouter.post(
    "/user/:id/:restaurantId/request",
    // isAuthenticated,
    createOrderController
  );
  orderRouter.get(
    "/user/:id/request/list",
    // isAuthenticated,
    getAllOrdersController
  );
  orderRouter.get(
    "/user/:id/request/:id",
    // isAuthenticated,
    getOrderByIdController
  );
  orderRouter.patch(
    "/user/:id/request/:id/update",
    // isAuthenticated,
    updateOrderController
  );
  orderRouter.get(
    "/user/:id/requests",
    // isAuthenticated,
    getOrderByClientNameController
  );
  orderRouter.delete(
    "/user/:id/request/:id/delete",
    // isAuthenticated,
    deleteOrderController
  );
};
