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
  restaurantUnitRouter.post(
    "/restaurant/:restaurantId/units/register",
    hasRole("ADMIN"),
    isAuthenticated,
    addRestaurantUnitHandler
  );

  // Para uma única role
  restaurantUnitRouter.get(
    "/units/:unitId",
    isAuthenticated,
    hasRole("ADMIN"),
    getRestaurantUnitByIdController
  );

  // Para múltiplas roles
  restaurantUnitRouter.get(
    "/units/:unitId",
    isAuthenticated,
    hasRole(["ADMIN", "MANAGER"]),
    getRestaurantUnitByIdController
  );

  // Para rotas que requerem roles específicas
  restaurantUnitRouter.post(
    "/units/:unitId/attendant",
    isAuthenticated,
    hasRole(["ADMIN", "MANAGER"]),
    addAttendantToUnitController
  );

  // Obter todas as unidades de um restaurante
  restaurantUnitRouter.get(
    "/restaurant/:restaurantId/units",
    isAuthenticated,
    hasRole("ADMIN"),
    getAllRestaurantUnitsController
  );

  // Atualizar uma unidade
  restaurantUnitRouter.put(
    "/units/:unitId",
    isAuthenticated,
    hasRole("ADMIN"),
    updateRestaurantUnitController
  );

  // Excluir uma unidade
  restaurantUnitRouter.delete(
    "/units/:unitId/restaurant/:restaurantId",
    isAuthenticated,
    hasRole("ADMIN"),
    deleteRestaurantUnitController
  );

  // Obter pedidos de uma unidade
  restaurantUnitRouter.get(
    "/units/:unitId/order",
    isAuthenticated,
    getRestaurantUnitOrdersController
  );

  // Remover atendente de uma unidade
  restaurantUnitRouter.delete(
    "/units/:unitId/attendant/:attendantId",
    isAuthenticated,
    hasRole("ADMIN"),
    removeAttendantFromUnitController
  );
};