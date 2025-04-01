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
import { hasRole, isAuthenticated, isRestaurantAdmin } from "../middlewares/index.ts";
import { getRestaurantUnitOrdersController } from "../controllers/OrderController.ts";

export default (restaurantUnitRouter: Router) => {
  // Criar uma nova unidade para um restaurante
  restaurantUnitRouter.post(
    "/restaurant/:restaurantId/unit",
    isAuthenticated,
    isRestaurantAdmin,
    addRestaurantUnitHandler
  );

  // Obter todas as unidades de um restaurante
  restaurantUnitRouter.get(
    "/restaurant/:restaurantId/unit",
    isAuthenticated,
    isRestaurantAdmin,
    getAllRestaurantUnitsController
  );

  // Obter todas as unidades (independente do restaurante)
  restaurantUnitRouter.get(
    "/unit",
    isAuthenticated,
    isRestaurantAdmin,
    getAllRestaurantUnitsController
  );

  // Obter uma unidade específica por ID
  restaurantUnitRouter.get(
    "/unit/:unitId",
    isAuthenticated,
    isRestaurantAdmin,
    getRestaurantUnitByIdController
  );

  // Atualizar uma unidade
  restaurantUnitRouter.put(
    "/unit/:unitId",
    isAuthenticated,
    isRestaurantAdmin,
    updateRestaurantUnitController
  );

  // Excluir uma unidade
  restaurantUnitRouter.delete(
    "/unit/:unitId/restaurant/:restaurantId",
    isAuthenticated,
    isRestaurantAdmin,
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
    isRestaurantAdmin,
    addAttendantToUnitController
  );

  // Remover atendente de uma unidade
  restaurantUnitRouter.delete(
    "/unit/:unitId/attendant/:attendantId",
    isAuthenticated,
    isRestaurantAdmin,
    removeAttendantFromUnitController
  );
};