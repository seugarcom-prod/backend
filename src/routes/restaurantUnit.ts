import { Router } from "express";
import {
  addRestaurantUnitHandler,
  deleteRestaurantUnitController,
  getAllRestaurantUnitsController,
  getRestaurantUnitByIdController,
  updateRestaurantUnitController,
  addAttendantToUnitController,
  removeAttendantFromUnitController
} from "../controllers/restaurantUnitController.ts";
import { hasRole, isAuthenticated } from "../middlewares/index.ts";
import { getRestaurantUnitOrdersController } from "../controllers/OrderController.ts";

export default (restaurantUnitRouter: Router) => {
  // Criar uma nova unidade para um restaurante
  restaurantUnitRouter.post(
    "/restaurant/:restaurantId/unit",
    // isAuthenticated,
    // isAdmin, // Em vez de hasRole("ADMIN")
    addRestaurantUnitHandler
  );

  // Obter todas as unidades de um restaurante
  restaurantUnitRouter.get(
    "/restaurant/:restaurantId/unit",
    getAllRestaurantUnitsController
  );

  // Obter todas as unidades (independente do restaurante)
  restaurantUnitRouter.get(
    "/unit",
    isAuthenticated,
    hasRole("ADMIN"),
    getAllRestaurantUnitsController
  );

  // Obter uma unidade específica por ID
  restaurantUnitRouter.get(
    "/unit/:unitId",
    getRestaurantUnitByIdController
  );

  // Atualizar uma unidade
  restaurantUnitRouter.put(
    "/unit/:unitId",
    isAuthenticated,
    hasRole("ADMIN"),
    updateRestaurantUnitController
  );

  // Excluir uma unidade
  restaurantUnitRouter.delete(
    "/unit/:unitId/restaurant/:restaurantId",
    isAuthenticated,
    hasRole("ADMIN"),
    deleteRestaurantUnitController
  );

  // Obter pedidos de uma unidade
  restaurantUnitRouter.get(
    "/unit/:unitId/order",
    isAuthenticated,
    getRestaurantUnitOrdersController
  );

  // Adicionar atendente a uma unidade
  restaurantUnitRouter.post(
    "/unit/:unitId/attendant",
    isAuthenticated,
    hasRole("ADMIN"),
    addAttendantToUnitController
  );

  // Remover atendente de uma unidade
  restaurantUnitRouter.delete(
    "/unit/:unitId/attendant/:attendantId",
    isAuthenticated,
    hasRole("ADMIN"),
    removeAttendantFromUnitController
  );
};